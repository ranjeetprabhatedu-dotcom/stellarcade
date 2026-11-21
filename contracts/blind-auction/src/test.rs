use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, BytesN, Env,
};

use crate::{BlindAuction, BlindAuctionClient, Error};

const START_TS: u64 = 1_000;
const BID_END: u64 = 2_000;
const REVEAL_END: u64 = 3_000;
const FEE_BPS: u32 = 500; // 5%
const RESERVE: i128 = 50;

struct Setup {
    env: Env,
    client: BlindAuctionClient<'static>,
    token: token::Client<'static>,
    seller: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = START_TS);

    let admin = Address::generate(&env);
    let seller = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());

    let contract_id = env.register(BlindAuction, ());
    let client = BlindAuctionClient::new(&env, &contract_id);
    client.initialize(&sac.address(), &FEE_BPS);

    Setup {
        token: token::Client::new(&env, &sac.address()),
        env,
        client,
        seller,
    }
}

fn fund(s: &Setup, who: &Address, amount: i128) {
    token::StellarAssetClient::new(&s.env, &s.token.address).mint(who, &amount);
}

fn salt(env: &Env, fill: u8) -> BytesN<32> {
    BytesN::from_array(env, &[fill; 32])
}

fn commit(s: &Setup, amount: i128, salt: &BytesN<32>) -> BytesN<32> {
    crate::commitment_hash(&s.env, amount, salt)
}

fn create(s: &Setup) -> u64 {
    s.client
        .create_auction(&s.seller, &RESERVE, &BID_END, &REVEAL_END)
}

#[test]
fn multi_bidder_happy_path_highest_bid_wins() {
    let s = setup();
    let a = Address::generate(&s.env);
    let b = Address::generate(&s.env);
    fund(&s, &a, 1_000);
    fund(&s, &b, 1_000);

    let id = create(&s);
    let salt_a = salt(&s.env, 1);
    let salt_b = salt(&s.env, 2);
    s.client
        .commit_bid(&id, &a, &commit(&s, 100, &salt_a), &200);
    s.client
        .commit_bid(&id, &b, &commit(&s, 180, &salt_b), &200);

    s.env.ledger().with_mut(|l| l.timestamp = BID_END);
    s.client.reveal_bid(&id, &a, &100, &salt_a);
    s.client.reveal_bid(&id, &b, &180, &salt_b);

    s.env.ledger().with_mut(|l| l.timestamp = REVEAL_END);
    let result = s.client.settle_auction(&id);

    assert_eq!(result.winner, Some(b.clone()));
    assert_eq!(result.winning_bid, 180);
    // 5% fee: seller gets 171, fee 9.
    assert_eq!(result.seller_proceeds, 171);
    assert_eq!(result.fee, 9);
    assert_eq!(s.token.balance(&s.seller), 171);
    // Loser a: deposit 200, bid 100, excess 100 refunded on reveal, remaining 100 refunded on settle.
    assert_eq!(s.token.balance(&a), 1_000);
    // Winner b: deposit 200, bid 180, excess 20 refunded on reveal, 180 stays with contract/seller.
    assert_eq!(s.token.balance(&b), 1_000 - 180);
}

#[test]
fn premature_reveal_is_rejected() {
    let s = setup();
    let bidder = Address::generate(&s.env);
    fund(&s, &bidder, 500);

    let id = create(&s);
    let sl = salt(&s.env, 9);
    s.client
        .commit_bid(&id, &bidder, &commit(&s, 80, &sl), &100);

    let result = s.client.try_reveal_bid(&id, &bidder, &80, &sl);
    assert_eq!(result, Err(Ok(Error::RevealTooEarly)));
}

#[test]
fn unrevealed_deposits_are_forfeited_on_settle() {
    let s = setup();
    let revealed = Address::generate(&s.env);
    let silent = Address::generate(&s.env);
    fund(&s, &revealed, 500);
    fund(&s, &silent, 500);

    let id = create(&s);
    let sl = salt(&s.env, 3);
    s.client
        .commit_bid(&id, &revealed, &commit(&s, 120, &sl), &150);
    s.client
        .commit_bid(&id, &silent, &commit(&s, 90, &salt(&s.env, 4)), &150);

    s.env.ledger().with_mut(|l| l.timestamp = BID_END);
    s.client.reveal_bid(&id, &revealed, &120, &sl);

    s.env.ledger().with_mut(|l| l.timestamp = REVEAL_END);
    let result = s.client.settle_auction(&id);

    assert_eq!(result.winner, Some(revealed.clone()));
    assert_eq!(result.winning_bid, 120);
    assert_eq!(result.forfeited, 150);
    // Seller: winning proceeds 120 * 95% = 114, plus forfeited 150.
    assert_eq!(s.token.balance(&s.seller), 114 + 150);
    assert_eq!(s.token.balance(&silent), 500 - 150);
}

#[test]
fn settle_with_no_revealed_bids_forfeits_all_deposits_to_seller() {
    let s = setup();
    let unrevealed1 = Address::generate(&s.env);
    let unrevealed2 = Address::generate(&s.env);
    fund(&s, &unrevealed1, 400);
    fund(&s, &unrevealed2, 600);

    let id = create(&s);
    s.client
        .commit_bid(&id, &unrevealed1, &commit(&s, 100, &salt(&s.env, 5)), &150);
    s.client
        .commit_bid(&id, &unrevealed2, &commit(&s, 200, &salt(&s.env, 6)), &250);

    // Skip directly past reveal window
    s.env.ledger().with_mut(|l| l.timestamp = REVEAL_END);
    let result = s.client.settle_auction(&id);

    assert_eq!(result.winner, None);
    assert_eq!(result.winning_bid, 0);
    assert_eq!(result.seller_proceeds, 0);
    assert_eq!(result.forfeited, 400); // 150 + 250
    assert_eq!(s.token.balance(&s.seller), 400);
    assert_eq!(s.token.balance(&unrevealed1), 250);
    assert_eq!(s.token.balance(&unrevealed2), 350);
}

#[test]
fn tie_highest_bid_awards_first_and_refunds_second() {
    let s = setup();
    let bidder1 = Address::generate(&s.env);
    let bidder2 = Address::generate(&s.env);
    fund(&s, &bidder1, 1_000);
    fund(&s, &bidder2, 1_000);

    let id = create(&s);
    let salt1 = salt(&s.env, 10);
    let salt2 = salt(&s.env, 11);

    s.client
        .commit_bid(&id, &bidder1, &commit(&s, 150, &salt1), &200);
    s.client
        .commit_bid(&id, &bidder2, &commit(&s, 150, &salt2), &200);

    s.env.ledger().with_mut(|l| l.timestamp = BID_END);
    s.client.reveal_bid(&id, &bidder1, &150, &salt1);
    s.client.reveal_bid(&id, &bidder2, &150, &salt2);

    s.env.ledger().with_mut(|l| l.timestamp = REVEAL_END);
    let result = s.client.settle_auction(&id);

    // First highest bidder wins
    assert_eq!(result.winner, Some(bidder1.clone()));
    assert_eq!(result.winning_bid, 150);

    // Second tied bidder gets full deposit back: 50 excess on reveal + 150 on settle = 1,000
    assert_eq!(s.token.balance(&bidder2), 1_000);
    assert_eq!(s.token.balance(&bidder1), 1_000 - 150);
}

#[test]
fn repeated_settle_and_reveal_are_rejected() {
    let s = setup();
    let bidder = Address::generate(&s.env);
    fund(&s, &bidder, 500);

    let id = create(&s);
    let sl = salt(&s.env, 12);
    s.client
        .commit_bid(&id, &bidder, &commit(&s, 100, &sl), &150);

    s.env.ledger().with_mut(|l| l.timestamp = BID_END);
    s.client.reveal_bid(&id, &bidder, &100, &sl);

    // Repeated reveal fails
    let res = s.client.try_reveal_bid(&id, &bidder, &100, &sl);
    assert_eq!(res, Err(Ok(Error::AlreadyRevealed)));

    s.env.ledger().with_mut(|l| l.timestamp = REVEAL_END);
    s.client.settle_auction(&id);

    // Repeated settle fails
    let res = s.client.try_settle_auction(&id);
    assert_eq!(res, Err(Ok(Error::AlreadySettled)));
}
