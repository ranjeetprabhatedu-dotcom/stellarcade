/**
 * Controller for managing user-specific operations.
 */
const User = require('../models/User.model');
const audit = require('../services/audit.service');
const { validateProfileInput } = require('../utils/profile-validation');

const ALLOWED_AUDIT_ACTIONS = ['wallet.deposit', 'wallet.withdraw', 'game.play'];
const GLOBAL_AUDIT_QUERY = '*';

/**
 * Resolves the wallet a profile write is allowed to act on. The bearer token
 * is the only trusted source of identity: the body is caller-controlled, so
 * a body naming a different wallet is rejected rather than silently ignored
 * (#1552). Returns null after forwarding the error to `next`.
 */
const ownedWalletForWrite = (req, next) => {
  const tokenWallet = req.user?.walletAddress;
  if (!tokenWallet) {
    const error = new Error('A valid wallet token is required.');
    error.statusCode = 401;
    error.code = 'UNAUTHENTICATED';
    next(error);
    return null;
  }

  const bodyWallet = req.body?.walletAddress || req.body?.address;
  if (!bodyWallet) {
    const error = new Error('walletAddress is required.');
    error.statusCode = 400;
    error.code = 'INVALID_REQUEST';
    next(error);
    return null;
  }

  if (bodyWallet !== tokenWallet) {
    const error = new Error('You can only write to the wallet your token proves you own.');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    next(error);
    return null;
  }

  return tokenWallet;
};

/** Turns a validation result into the same typed error the rest of this file uses. */
const throwIfInvalid = (result) => {
  if (!result) return;
  const error = new Error(result.message);
  error.statusCode = result.statusCode;
  error.code = result.code;
  throw error;
};

/**
 * Shapes a DB user row into the wire format the frontend's `UserProfile`
 * type expects. Public responses use a strict allowlist: Telegram identifiers
 * are linked-account data and are only returned to the authenticated owner.
 */
const serializeUser = (user, { includeLinkedAccounts = false } = {}) => {
  const toIso = (value) => (value instanceof Date ? value.toISOString() : value);

  const publicProfile = {
    address: user.wallet_address,
    username: user.username || undefined,
    createdAt: toIso(user.created_at),
    updatedAt: toIso(user.updated_at),
    ageConfirmedAt: toIso(user.age_confirmed_at) || undefined,
  };

  if (!includeLinkedAccounts) {
    return publicProfile;
  }

  return {
    ...publicProfile,
    telegramHandle: user.telegram_handle || undefined,
    telegramUserId: user.telegram_user_id || undefined,
    telegramLinked: Boolean(user.telegram_handle || user.telegram_user_id),
  };
};

const isOwner = (req, user) => {
  if (!req || !req.user || !user) return false;
  const authenticatedAddress = req.user.walletAddress || req.user.address;
  return req.user.id === user.id || authenticatedAddress === user.wallet_address;
};

const adminRoles = () =>
  (process.env.AUDIT_ADMIN_ROLES || '')
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean);

const hasAdminAuditAccess = (req) => {
  const roles = req && req.user && Array.isArray(req.user.roles) ? req.user.roles : [];
  return adminRoles().some((role) => roles.includes(role));
};

const forbidden = (message, code) => {
  const error = new Error(message);
  error.statusCode = 403;
  error.code = code;
  return error;
};

const getAuditLogs = async (req, res, next) => {
  try {
    const { action } = req.query;
    const requestedActor = req.query.actor;
    const limit = req.query.limit === undefined ? 50 : parseInt(req.query.limit, 10);
    const authenticatedActor =
      (req.user && (req.user.walletAddress || req.user.address)) ||
      (req.user && req.user.id != null ? String(req.user.id) : null);

    if (!authenticatedActor) {
      throw forbidden('Audit logs require an authenticated actor.', 'AUDIT_ACTOR_REQUIRED');
    }

    if (req.query.limit !== undefined && (Number.isNaN(limit) || limit < 1)) {
      const error = new Error('Query parameter "limit" must be a positive integer.');
      error.statusCode = 400;
      error.code = 'INVALID_QUERY_PARAM';
      throw error;
    }

    if (action && !ALLOWED_AUDIT_ACTIONS.includes(action)) {
      const error = new Error('Query parameter "action" has an unsupported value.');
      error.statusCode = 400;
      error.code = 'INVALID_QUERY_PARAM';
      throw error;
    }

    const admin = hasAdminAuditAccess(req);
    const explicitGlobal = requestedActor === GLOBAL_AUDIT_QUERY || requestedActor === '';
    const isGlobalQuery = explicitGlobal || (requestedActor === undefined && admin);

    if (explicitGlobal && !admin) {
      throw forbidden(
        'Global audit log queries require an explicit admin policy.',
        'AUDIT_GLOBAL_FORBIDDEN'
      );
    }

    const isSelfByDefault = requestedActor === undefined && !admin;
    if (!isGlobalQuery && !isSelfByDefault && !admin && requestedActor !== authenticatedActor) {
      throw forbidden('You may only read your own audit logs.', 'AUDIT_ACTOR_FORBIDDEN');
    }

    const actor = isGlobalQuery
      ? undefined
      : requestedActor === undefined
        ? authenticatedActor
        : requestedActor;
    const entries = await audit.list({ actor, action, limit, allowGlobal: isGlobalQuery && admin });
    res.status(200).json({ items: entries });
  } catch (error) {
    next(error);
  }
};

/**
 * Looks up a profile by wallet address, scoped strictly to the address
 * given, never "whichever profile was most recently updated". A missing
 * profile is a normal 404, the standard signal that a wallet needs
 * onboarding, not an error.
 */
const getProfile = async (req, res, next) => {
  try {
    const address = req.query.address;
    if (!address || typeof address !== 'string') {
      const error = new Error('Query parameter "address" is required.');
      error.statusCode = 400;
      error.code = 'INVALID_QUERY_PARAM';
      throw error;
    }

    const user = await User.findByWallet(address);
    if (!user) {
      const error = new Error(`No profile found for wallet address ${address}.`);
      error.statusCode = 404;
      error.code = 'PROFILE_NOT_FOUND';
      throw error;
    }

    res.status(200).json(serializeUser(user, { includeLinkedAccounts: isOwner(req, user) }));
  } catch (error) {
    next(error);
  }
};

const createProfile = async (req, res, next) => {
  try {
    throwIfInvalid(validateProfileInput(req.body));

    const walletAddress = ownedWalletForWrite(req, next);
    if (!walletAddress) return;

    let user = await User.findByWallet(walletAddress);
    if (!user) {
      user = await User.create({
        wallet_address: walletAddress,
        ...(req.body.username !== undefined ? { username: req.body.username.trim() } : {}),
        age_confirmed_at: req.body.ageConfirmed === true ? new Date() : null,
      });
    } else {
      // A wallet reserved at login has no public name yet. Finish that row
      // rather than inserting a second profile, and keep an existing name
      // untouched so the create call stays idempotent.
      const patch = {};
      if (!user.username && req.body.username !== undefined) {
        patch.username = req.body.username.trim();
      }
      if (req.body.ageConfirmed === true && !user.age_confirmed_at) {
        patch.age_confirmed_at = new Date();
      }
      if (Object.keys(patch).length > 0) {
        user = await User.updateByWallet(walletAddress, patch);
      }
    }

    res.status(201).json(serializeUser(user, { includeLinkedAccounts: isOwner(req, user) }));
  } catch (error) {
    next(error);
  }
};

/**
 * Updates an existing profile — username and/or Telegram-link fields.
 * Only fields actually supplied are touched, so a Telegram-linking sync
 * that sends `telegramUserId` alone never clobbers the display name, and
 * vice versa.
 */
const updateProfile = async (req, res, next) => {
  try {
    throwIfInvalid(validateProfileInput(req.body));

    const walletAddress = ownedWalletForWrite(req, next);
    if (!walletAddress) return;

    const user = await User.findByWallet(walletAddress);
    if (!user) {
      const error = new Error(`No profile found for wallet address ${walletAddress}.`);
      error.statusCode = 404;
      error.code = 'PROFILE_NOT_FOUND';
      throw error;
    }

    const patch = {};
    if (req.body.username !== undefined) patch.username = req.body.username.trim();
    if (req.body.telegramUserId !== undefined) patch.telegram_user_id = req.body.telegramUserId;
    if (req.body.telegramHandle !== undefined) patch.telegram_handle = req.body.telegramHandle;
    // Only ever set, never clear — an absent or false `ageConfirmed` here
    // must not erase a confirmation the player already gave.
    if (req.body.ageConfirmed === true && !user.age_confirmed_at)
      patch.age_confirmed_at = new Date();

    const updated =
      Object.keys(patch).length > 0 ? await User.updateByWallet(walletAddress, patch) : user;

    res.status(200).json(serializeUser(updated, { includeLinkedAccounts: isOwner(req, updated) }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  createProfile,
  updateProfile,
  getAuditLogs,
  serializeUser,
};
