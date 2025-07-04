class ReverseDataTool {
    constructor() {
        this.rawData = [];
        this.byteStates = [];
        this.stagedBytes = [];
        this.suggestions = [];
        this.acceptedDecodings = [];
        this.toastContainer = null;
        this.isAccountData = false;
        this.currentAccountInfo = null;

        // Load RPC settings
        this.solanaRpcUrls = this.loadRpcEndpoints();
        this.currentRpcIndex = 0;
        this.rpcTimeout = this.loadRpcTimeout();
        this.enableBatching = this.loadBatchingEnabled();

        // Known Solana program addresses
        this.knownPrograms = {
            '11111111111111111111111111111111': 'System Program',
            'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'SPL Token Program',
            'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb': 'Token-2022 Program',
            'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL': 'Associated Token Program',
            'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf': 'Squads v3 Program',
            'SMPLecH534NA9acpos4G6x7uf3LWbCAwZQE9e8ZekMu': 'Squads v4 Program',
            'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s': 'Metaplex Metadata',
            'p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98': 'Metaplex Token Metadata',
            'cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ': 'Candy Machine v2',
            'CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhdefbAnjHG3JR': 'Candy Machine v3',
            'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'Jupiter Aggregator',
            '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM': 'Raydium AMM',
            'EhhTKczWMGQt46ynNeRX1WfeagwwJd7ufHvCDjRxjo5Q': 'Raydium Staking',
            'ComputeBudget111111111111111111111111111111': 'Compute Budget Program',
            'AddressLookupTab1e1111111111111111111111111': 'Address Lookup Table Program',
            '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P': 'Pump.fun Program'
        };

        // Token account data size (165 bytes for SPL Token)
        this.TOKEN_ACCOUNT_SIZE = 165;
        this.TOKEN_MINT_SIZE = 82;

        // Account caching
        this.accountCache = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        // Smart search
        this.searchMatches = [];
        this.currentMatchIndex = -1;
        this.searchDebounceTimer = null;
        
        // Range selection
        this.lastClickedByte = -1;

        // Pattern database
        this.patterns = {
            "discriminators": {
                "43e5b9bce20bd23c": "updateVault",
                "b9adbb5ad80feee9": "disable",
                "ee9965a9f3832401": "setOperator",
                "b185205ae5d8832f": "newLocker",
                "cf6b2ca04bdec31b": "printListingReceipt",
                "958c57df69d48396": "withdrawSolFromPair",
                "a9dc29fa23be85c6": "cremaSwap",
                "5655303366b1e270": "setCurrentRewardsWrapperV0",
                "5a934bb255580489": "delegate",
                "dfb3e27d302e274a": "liquidate",
                "6ad403fac3e040a0": "getPnl",
                "39b35e88524f19b9": "crankInit",
                "61ac7c10af0af693": "vrfCloseAction",
                "70a982a1ef4ef8ac": "setVaultUiStatus",
                "02e81d4a80e0b2f6": "cancelFuturesOrders",
                "3c3f11400dc4a6f3": "updateFeeOwner",
                "e252ef776b88a6f0": "groupCreate",
                "2bc0c1d1795aba87": "aggregatorTeeSaveResult",
                "ddc2ee37aa5dff4b": "createSsl",
                "65830020f636fb65": "getIncreasePosition",
                "e4fd83cacf745912": "borrow",
                "8f7b85f934616f72": "patchTakeOrder",
                "67c009be2bd1eb73": "updateLockedProfitDegradation",
                "1d441950a778c1ae": "tempRepairIotOperationsFund",
                "4e6da984905edd39": "mintDataCreditsV0",
                "8f9b1bd6cc63c9e3": "deleteTestPool",
                "8fd4655f69d1b801": "swapUnevenVaults",
                "e6b598ad14a39df3": "registerChain",
                "3a32ac6fa697165e": "mip1Sell",
                "3e7b1496386dd191": "programConfig",
                "3c3f327b0cc53cbe": "placeOrders",
                "9e4d04fdfcc2a1b3": "modifyOrderByUserId",
                "032ca4b87b0df5b3": "tokenMint",
                "8af8b94f03737339": "lockWithWhitelistEntry",
                "692975d86771b0ae": "removeLiquidStake",
                "9ed826108c250f83": "closePositionShort",
                "94237ef71ca987af": "initUserProfile",
                "b8b07df48ba8fe81": "foxClaimPartial",
                "8c5d3926327ddb00": "leverage_vault_keeper_closing",
                "b85717c19ceeaf77": "updateGlobalConfigAdmin",
                "3e0f75ec2f01598b": "start",
                "a937b71898b4a70b": "change_pool_owner",
                "b8ba379aa1c881fa": "withdraw_ea_fees",
                "2441b93601d264a3": "openDca",
                "022303a9ce145556": "update_mode_apy",
                "0703967f94283dc8": "addLiquidityByStrategy",
                "5ca12ef6ffbd1616": "updateDynamicFeeParameters",
                "b5e6926274acf91b": "updateAgPriceFeed",
                "5db000cd453f5750": "change_max_supply",
                "9eb42f5185e7a8ee": "cancel_timelock",
                "a1b028d53cb8b3e4": "updateAdmin",
                "777fd887183fe5f2": "instant_remove_validator",
                "5de284a68d093065": "depositNft",
                "399695da7fc483b3": "signSecurityAgent",
                "fba300345bc2bb5c": "set_admin",
                "0744ba81dd8480c6": "transferWrappedWithPayload",
                "6aa20ae28444df15": "tcompNoop",
                "a76bcc63df86343f": "transferBetweenProducts",
                "41c4b1f753972182": "cancelRequest",
                "eb4491203b693719": "altSet",
                "0d747b827ec63922": "addMember",
                "13617eeecc8d454c": "claimOrderCancel",
                "dd1b235c78a44c0c": "processDelayExpiredOrders",
                "c6c682cba35faf4b": "cancelSell",
                "dab216baa1e75087": "mintLegacy",
                "6ec9be40a6ba6983": "setPoolFreeze",
                "1a88e1d916155314": "increasePositionPreSwap",
                "797f12cc49f5e141": "borrowObligationLiquidity",
                "e5233d5b0f0e63a0": "setCollectionV2",
                "dab0e1d13f9ed7c2": "pause_proxy",
                "31df9c560202fd36": "initTokenPair",
                "7dbf7771060ea417": "editPoolInPlace",
                "1ec5ab5c79b897a5": "set_manager",
                "267e5f6fe2d07b17": "initializeTokenMetadata",
                "9781242e66c36f7a": "unbond",
                "d12ad0b38c4e122b": "closeEscrowAccount",
                "ad9500238c543394": "delegationDeposit",
                "85beba30d0a4cd22": "vrfProveAndVerify",
                "463161034c5f5bfd": "completeWrapped",
                "cfca0420cd4f0db2": "setTokenBadgeAuthority",
                "80a68e09febb8fae": "removeInsuranceFundStake",
                "3812273d9bd32c85": "updateWithdrawGuardThreshold",
                "3af198b86896a977": "withdrawRevenue",
                "0e8133aa4cba84a5": "transferMarketTokenSurplus",
                "c10aa779de061592": "initEscrowV1",
                "1a10a90715caf219": "invoke",
                "9049a3948f222890": "stabbleStableSwap",
                "4e987e8085f36c8c": "kaminoDepositReserveLiquidity",
                "83f83dd398cd7aee": "initializeUserAccount",
                "e3ddc8d4246b9524": "initUserPoolLiquidity",
                "657cc2b577f6b408": "trigger_default",
                "0f9f1889d374ae3c": "complete_gt_exchange",
                "c208a15799a419ab": "vaultTransactionExecute",
                "357e54e2498c8a13": "setWooRange",
                "6e4f0d47d06f3842": "jupiter_set_max_swap_slippage",
                "5fb7870404a54185": "meteora_dlmm_swap2",
                "b017291c176f0804": "accept_owner",
                "ccbeb6e00fdbf779": "deposit_user_vault",
                "4d7743a4a6be0d29": "platform_fee_withdraw",
                "a6e20708a9efdc45": "auto_add_validator_to_pool",
                "4eb1627bd215bb53": "newClaim",
                "05a87635482ecb92": "increaseLockedAmount",
                "c9b155622fdd8af8": "ixGateSet",
                "05344921967361ce": "setEnableSlot",
                "87d1a55568b81ddc": "claimLiquidityMiningRewards",
                "4c5e832c893da16e": "updateCollateralInfo",
                "15c198bc45d5dc26": "setClearingFeeTiers",
                "589aa43cf3d8db4a": "setOracleProductsV2",
                "8d918607e78daa44": "sellRepay",
                "e6d82fb6a575d267": "cropperSwap",
                "ebf279d89eeab4ea": "setAndVerifyCollection",
                "36554c46e4faa451": "decompressV1",
                "354da79daf8390ab": "cancelOrderByClientOrderIdNoError",
                "11457968e1ce8cd7": "updateZetaGroupExpiryParameters",
                "6fc1c8bc9f7ef234": "RemoveCollectionPluginV1",
                "0b0c7798ef26f176": "setAccountFeeTier",
                "28f3bed9d0fd56ce": "cancelBid",
                "6bcdf9e297235600": "setDefaultProtocolFeeRate",
                "646e53665607699d": "updateIncreasePositionRequest",
                "c81039978c92bf17": "UpdateCollectionPluginV1",
                "7a7f315944e4559d": "cleanZetaMarkets",
                "a8c16540c75a9668": "createPoolNode",
                "b04a73d236b35b67": "closeOpenOrdersAccount",
                "842a358a1cdcaa37": "removePool",
                "d285e180c2320d6d": "updateInitialPctToLiquidate",
                "eceeb045ef0ab5c1": "revertFill",
                "50fc7a3e28da5b64": "updatePerpMarketMaxSpread",
                "632e488464ebd375": "set_publisher_stake_account",
                "cf96d59c8a68ee8e": "moonshotWrappedBuy",
                "26143e26fcfeb4d8": "foxBuyFromEstimatedCost",
                "dced5e411b499ccb": "initOapp",
                "a529e0b81aae03c1": "createTokenDistributionConfig",
                "7973e06d49347820": "createBotAccount",
                "44facd59d98e0d2c": "disburse",
                "747831d0ae9691aa": "swap_route_with_whitelisted_mint",
                "dac407af82660bff": "batchAccountsClose",
                "2e2729876fb7c840": "initializeCustomizablePermissionlessLbPair",
                "be037f77b2579db7": "claimReward2",
                "7ff758a4c9004f07": "stake_authorize",
                "766faa0ee0bb1577": "meteora_dlmm_remove_liquidity2",
                "58e88da97c342749": "fee_withdraw_sponsor_initialize",
                "d32fe3ffc2196c83": "create_lending",
                "f767a05f2aa16c5b": "create_withdrawal",
                "1a9b3db3359d501e": "playerClose",
                "aa54bafd83955fd5": "initialize_curve",
                "1f2da205c1d986bc": "withdraw_strategy",
                "87e734a70734d4c1": "flashBorrowReserveLiquidity",
                "376411f3f2b52ba5": "stepTokenSwap",
                "ac96f9b5e9f14e8b": "getAddLiquidityAmountAndFee",
                "a21e678baabda821": "transferBetweenSubAccounts",
                "8e6c4ded7c65981f": "voidMarketPosition",
                "9aaefc9d5bd7b39c": "setWormholeAddress",
                "855fcfaf0b4f762c": "postUpdate",
                "7029d112f8e2fcbc": "updateOracle",
                "74efe2952ea3dd03": "initializeZetaMarket",
                "0a379ae081aea108": "initializePerpSyncQueue",
                "6e3b25376195a91c": "fixMobileGenesisAccountsV0",
                "cbc4bb3c0daabe45": "closeCrossMarginAccount",
                "11e9b50d5c9ab2f3": "setMinSlotsForReinvest",
                "3792a701eb6dc568": "transferToCega",
                "0ee5fbaf17dc2013": "dropAdmin",
                "af2ab957908366d4": "settle",
                "f3fb7c9cd3d376ef": "updateCandyMachine",
                "2bc6b2c8cd607abb": "setTimeInForce",
                "43eb4266a7ab78c5": "initializeMarginAccount",
                "cbf7549f68fd9450": "toggleMarketMaker",
                "9ec99ebd215da267": "withdrawProtocolFee",
                "fbad85c69e239861": "initializePositionV0",
                "afad8161cabaae11": "settleSpotFunds",
                "402fe33679b023c6": "getOperatorBalance",
                "a9b25419af3e1df7": "initializePrelaunchOracle",
                "de5aca5e1c2d73b7": "settleFundingPayment",
                "fdd1e70ef2d0f382": "updateSpotMarketAssetTier",
                "0b0dff35388868b1": "updateSpotMarketLiquidationFee",
                "d53301bb6cdce6e0": "placeAndTakePerpOrder",
                "679867665990c147": "updatePerpMarketPerLpBase",
                "6e5ff55b5ef56fe1": "setBroker",
                "46bc98ad75d590c3": "remove_pool_operator",
                "905f006b7727f88d": "pause_protocol",
                "61a1f1a70620d535": "restake",
                "894beec3a3114917": "setPoolMinSwapAmount",
                "ca2898efaffb42e4": "stake_delegate_stake",
                "fe1cbf8a9cb3b735": "subscribe",
                "ff8cbe66981eb370": "gambaInitialize",
                "5f81edf00831df84": "cancelOrder",
                "2af2426ae40a6f9c": "transferAdmin",
                "f779286323526420": "getSwapAmountAndFees",
                "526bb61b542052f7": "validateNft",
                "5f87c0c4f281e644": "initialize_reward",
                "76c13b2db4bd6294": "createPerpMarket",
                "6a8026a967ee6693": "revokeAccess",
                "9152f19c1a9ae9d3": "enableVault",
                "55a6db6ea88fb4ec": "auctioneerWithdraw",
                "3a7fbc3e4f52c460": "decreaseLiquidityV2",
                "fdea8068c0bc2d5b": "increasePosition",
                "ee4d945bc8975c92": "placeBid",
                "cb7d86f02edf17b2": "markSwap",
                "9da3f77515086920": "voidOrder",
                "2c5697159eb90824": "pauseState",
                "05dd6b17f7d32fdd": "serum3SettleFundsV2",
                "202e401c954bf358": "updateAuthority",
                "998f3cd0dc05a291": "transferRewards",
                "26a77d67c7f0c27e": "cacheOraclePrices",
                "3dd627f841d49924": "fulfillOrder",
                "f71cc1e437ee1f71": "claimTips",
                "e6790ea41cde7576": "vrfRequestRandomness",
                "5826ecd41fb912a6": "editSingleListing",
                "a00ed16bf7874edb": "redeemAutocompoundAndAutoreceiveLiquidatedNft",
                "9503c96c823838d2": "initializeTreasuryManagementV0",
                "494d5e1f08095c20": "getExitPriceAndFee",
                "47efec99d23efe4c": "updateSpotMarketBorrowRate",
                "5983efc8b28d6ac2": "initializeProtocolIfSharesTransferConfig",
                "38a681099dcd76d9": "whirlpoolSwapV2",
                "2ad888d7eb84a0aa": "resolveBatchDeposit",
                "136a6f9a72c555f9": "updateBetV2",
                "217b3817828e9481": "add_yield_distributing_lender",
                "1cc896c845382685": "harvest_yield",
                "52f2ca5daac4d771": "queued_redeem",
                "3711999478f25005": "sell_ledger",
                "6a0a26cc8bbc7c32": "borrow_principal",
                "5055d14818ceb16c": "removeLiquidity",
                "412749d53422b55e": "auto_remove_validator_from_pool",
                "746b18cf6531d54d": "update_parameters",
                "208b70ab0002e19b": "newDistributor",
                "eeb66d717cff4812": "write_instruction_params_fragment",
                "d6a997d5fba756db": "lendingAccountLiquidate",
                "4749389bca8e6496": "set_lp_token_metadata",
                "a2962e5b249ffe33": "redeemWinningLotTicket",
                "fbe877a6e1b9a9a1": "aldrinSwap",
                "5ee3f08543e0196d": "updateMakerV0",
                "82c98e9c9fcfa816": "withdrawProjectFee",
                "617b55364c103d9d": "repayLoanV3",
                "be6974dde5c6d053": "updateVolatility",
                "32db5f495da2f50e": "withdrawPercentFee",
                "d3722804757aeaa6": "adminRegisterShortReferrer",
                "f87de814754eeaea": "solClosePool",
                "b6313ff88c51287e": "settleSale",
                "3e1844b54cb1c07e": "newFuturesOrder",
                "1f013257ed656184": "setFeeAuthority",
                "8cfeb08e8c8fb888": "getService",
                "a312239d31a4cb85": "executePartialSale",
                "752df1951812c241": "initializePositionBundle",
                "4762cba2c16dbbf0": "CreateCollectionV1",
                "17cbaa90dc86522e": "activateFbond",
                "178eaad55ddab302": "AddCollectionPluginV1",
                "0e3e95ca8f113873": "forceCancelOrdersV2",
                "f1726a4f1059e97d": "takeLoanV3Compressed",
                "ad7e57c4567f645c": "resizeLegacyInscriptionAsUauth",
                "0dbcf86786d96af0": "fillPerpOrder",
                "41c956f2869422b3": "openOrIncreasePositionWithSwapShort",
                "e16388066cca1261": "genesisStakePatch",
                "36ea538d34bf2e90": "raydiumCpSwap",
                "bfa2b08059ab939e": "modify_airdrop",
                "b25bca24458aa95d": "modify_platform",
                "af025631e1cae8bd": "setSplits",
                "4963fd30c36fd0b8": "update_to_latest_redemption_record",
                "ab47d0f93b53f36a": "start_committed_credit",
                "fbb227f3b723656d": "refresh_credit",
                "10c8d4125f2b6b59": "set_config_authority",
                "eef224b5208fd84b": "programConfigSetAuthority",
                "5964e0124546364c": "batchAddTransaction",
                "e16e41e18a658e48": "claimWooracleAuthority",
                "db59239ee00cc85a": "manage_collateral_withdraw_orca_liquidity",
                "181ec828051c0777": "create",
                "78bf19b66f31b337": "initializeTipDistributionAccount",
                "d5a09158c5443f96": "playerInitialize",
                "9a9ccc0ca0c04f50": "platform_fee_sol_proxy_swap",
                "6c6c8de41506f63b": "lottery_add_manual",
                "7034a74b20c9d389": "setRewardParams",
                "0fb72156571c9791": "edit",
                "3339e12fb69289a6": "mint",
                "671e4efc1c802803": "createGovernor",
                "598864726e60f227": "balanceClearingSwap",
                "2e9cf3760dcdfbb2": "increase_liquidity",
                "8b10c67c0ea97e90": "initIssuerPda",
                "3d11f0f5ac429fe8": "createReferral",
                "b9ee215b86d2611a": "removeStrategy",
                "7fcd3b97042fa452": "bufferRelayerInit",
                "1629d9dc15683d63": "ocpSell",
                "7fe410f45344965e": "cleanZetaMarketsHalted",
                "26cc096509ce6ab8": "genesisIssueDelegatedDataCreditsV0",
                "87a5535eaf189504": "createPositionList",
                "84e66678cd09edbe": "deltafiSwap",
                "5acfbfc0d0f3b63a": "cancelCnft",
                "015de43500f5bc7f": "tempUpdateIotOperationsFundMetadata",
                "2103bc34b9de0004": "aggregatorSaveResultV2",
                "80ad4a0e6e54613d": "processDepositQueue",
                "b8cdd3c058be719c": "fundProductAuthority",
                "151b891de295dd64": "setFlashLoanFee",
                "526e284ddc33a77c": "updateOptionBarrierDetails",
                "d31f15d2406c42c9": "updatePerpMarketName",
                "3713eea9e35ac8b8": "settleExpiredMarketPoolsToRevenuePool",
                "c2ae57662b942070": "updatePerpMarketFeeAdjustment",
                "f3a124eddf104b5b": "claimLockUp",
                "81f71cb39b8f3107": "setProtocolFeeRecipient",
                "fe38b4897935800d": "setStakingLmEmissionPotentiometers",
                "878aeb5be0087003": "setPoolAllowTrade",
                "a7d8d391bb00f86c": "setRateAuthority",
                "7ff5139e52fa2112": "perpsV2Swap",
                "bcd87c337e843442": "earn_config_create",
                "274e00fb461661a3": "update_huma_config",
                "29fe38a2d0621709": "create_receivable",
                "56b7a3900032ad1c": "swapRoute",
                "58ae629418fc5d59": "cancel_swap",
                "f91d7c1cd544ed6e": "withdraw_from_treasury_vault",
                "b3dc7001d66703e6": "refresh_pool_assets",
                "70bf65ab1c907fbb": "claimFee2",
                "d4cb394e4bf5de05": "update_mint",
                "afaf6d1f0d989bed": "initialize",
                "a5b07d06e7abbad5": "permanent_lock_position",
                "eb47d3c472c78f5c": "commission_spl_swap",
                "c21537e5d56a9338": "platform_fee_sol_wrap_unwrap",
                "121ef8c91cc48976": "add_validator_to_blacklist",
                "5c10e24f1ff23576": "solFulfillBuy",
                "ea674352d0eadba6": "repay",
                "fafb2a6a2989baa8": "unverifyCollection",
                "96e18b6a51aa5bd1": "upgradeGuardianSet",
                "20bb17039ce837b1": "removeVote",
                "dbc858b09e3ffd7f": "update",
                "4239d8fba56b8062": "crankPop",
                "43032272beb9113e": "configMarinade",
                "e8d447313aac55ea": "internalSwap",
                "fa893db52692798e": "depositDeliverable",
                "235613b94ed44bd3": "initializeBinArray",
                "504815bf1d792d6f": "setPerpetualsConfig",
                "ab2153ac94d7ef61": "setVote",
                "d87840eb9b13e563": "cancelExpiredOrder",
                "17c173cadc9d4498": "initializeDataCreditsV0",
                "ff045802d5af5716": "leaseSetAuthority",
                "d6341e41d7267a66": "updateDataOnlyTreeV0",
                "b2aa024ef017beb2": "flashLoanEnd",
                "364996d0cf051211": "withdrawMarginAccount",
                "47c9af7affcfc4cf": "updatePerpMarketStatus",
                "223a39446150f406": "depositIntoPerpMarketFeePool",
                "bc746c174421ccdc": "swapTokensForSol",
                "b37aba8bdf48cd3a": "removeCollateralLong",
                "7be01efc9f01fa7c": "cancelTakeProfit",
                "aaeeded6f5ca6c9b": "perpsAddLiquidity",
                "46ba09cbea9f322c": "changeMaxUtilization",
                "8cf669a550558f12": "withdrawHostTip",
                "221191f4cede8b92": "createTokenDistributor",
                "1cedbe41841885f3": "update_market_metadata",
                "d975b1d2b691da48": "multisigRemoveMember",
                "30cc4139d2469c4a": "multisigSetRentCollector",
                "410abc21058f36a1": "setOracleMaximumAge",
                "81b2020dd9ace6da": "create_vesting_account",
                "38ade6d0ade49ccd": "swapWithPriceImpact",
                "5bf90fa51a81fe7d": "set_activation_point",
                "38eebd23c89d2a42": "change_amp_factor",
                "99ec961e2402f614": "open_loop",
                "d37c430fd3c2b2f0": "register",
                "3a0cb8760e636e11": "poolAuthorityConfig",
                "2558cf552a907ac5": "playGame",
                "8aaec4a9d5ebfe6b": "updateRewardDuration",
                "054d9032dee4e9ab": "commission_spl_from_swap",
                "913c167152a35b3e": "delete_pregrad",
                "5d885ee62036a7f2": "increase_additional_validator_stake",
                "856601b4910b8ab4": "handle_receive_message",
                "0260b7fb3fd02e2e": "refund",
                "919eb8d4034a9c76": "saberExchange",
                "90832c9cc50ac52b": "depositSell",
                "b59d59438fb63448": "add_liquidity",
                "d6d3d14f6b69f7de": "createState",
                "cb2525601755e92a": "updateRewardMapping",
                "8f304014a11df23e": "processCommissionPayment",
                "15f28b5a3c062e28": "mortgage",
                "e3209a7d8f1ceb50": "closeCacheAccount",
                "d54bb5741de17dd1": "updateAuthorizedNativeSender",
                "d70d19bb0b5d228f": "updateNftList",
                "4188feff3b82eaae": "buySpl",
                "1b5a61d111730728": "configValidatorSystem",
                "1643176296b246dc": "collectProtocolFees",
                "280e6d78de9cd100": "serum3RegisterMarket",
                "e5096a495bd56db7": "addAuthority",
                "e22aae8f909f8b01": "signTerms",
                "4e56fbc9a8a2a2a8": "createWhitelistedAccount",
                "3646be62f6f26374": "computeAccountData",
                "989068e4f5eaa4e0": "createOptionProposalMeta",
                "ee4c24da84b1e0e9": "cancelBuy",
                "bf35a6617cd4e4db": "withdrawSolFees",
                "bbb3f346f85a5c93": "initializeInsuranceFundStake",
                "2f7c75ffc9c5825e": "modifyOrder",
                "d4ce82ad1522c728": "fillSpotOrder",
                "030c71deb10498a5": "create_voter_record",
                "e00ee86029e6b712": "update_y",
                "f824e5ea0b849114": "update_max_voter_weight",
                "ff40a317d154b97c": "addLiquidStake",
                "8a6be211c8eda075": "disableTokensFreezeCapabilities",
                "e2f92239bd15b165": "thaw",
                "3cadf767045d8230": "collect_fee",
                "5e3e7f9a1bad2a46": "leverage_vault_change_price_oracle",
                "e7253798af0851ac": "protocol_set",
                "9ea5c7da7b219608": "setMakerUser",
                "20865baa764ff8b9": "createOrders",
                "dce0a08d66a023e7": "set_pool_settings",
                "f86fda0837fcc4b5": "withdraw_yields",
                "2de3b47145d40707": "setFeeAdmin",
                "e298682a0135c4f0": "set_redemption_paused",
                "fc3ffac96237820c": "drift_deposit",
                "6bf49e0fe1ef62f5": "drift_initialize_user",
                "e9724da49fd18989": "remove_validators_from_blacklist",
                "ff43431a5e1f2214": "marginfiGroupInitialize",
                "f1ff11e0898905dd": "writeToLegacyInscriptionAsUauthV3",
                "58b746f9d67652d2": "serumSwap",
                "cc0a8f622522c05e": "initRequest",
                "e15fdf094207a2a7": "transferMarketEscrowSurplus",
                "33f8cc7d65b66b92": "perpCancelAllOrdersBySide",
                "64aac42248e4dbec": "updateVolatilityNodes",
                "55a372798ba72925": "initializeInsuranceDepositAccount",
                "daf5ed6d2ece0d0e": "forecloseLoanEscrow",
                "19d91e9ed2f0ad0a": "lpOperatorUpdateInterestRate",
                "cf68529dc1e54999": "updateMobileInfoV0",
                "fde581252f480bf0": "withdrawMercantiFee",
                "b3f345651b3ab745": "returnSeizedNft",
                "e3015aacbc300e7f": "removeAuthorisedOperator",
                "3fb2ce3763e6aebe": "setPerpetualMarketLiquidityMiningInfo",
                "4532aec57bc448ec": "updateMarginParameters",
                "66ea243c5811023c": "cancelFuturesOrder",
                "e517cb977ae3ad2a": "route",
                "8561828fd7e524b0": "setCustodyConfig",
                "18d1ed18784df656": "getClaimedGemFarmStaking",
                "b663e8bcca2647d3": "lpOperatorCreateTradingPool",
                "1812819595202d69": "transferFeeVault",
                "cc1a3e8670c9a2a0": "initializeMakerV0",
                "2bc92533e98f94bd": "unstakeGemFarmStakingByAdmin",
                "35b4ee47a9e3541a": "setSubAccountDelegate",
                "7dff950e6e224818": "closeAccount",
                "c72b785167076870": "unstakeV0",
                "28fd3471291bfc2c": "delistFromTensorswap",
                "8d620efb71085d9e": "multipleNewFuturesOrders",
                "2d4f51a0f85a5bdc": "placeSpotOrder",
                "82ad6b2d77691a71": "updatePerpMarketMarginRatio",
                "422a4b31908e20dd": "createMarketPosition",
                "161780112885e0e4": "captureV1",
                "26d963defdfd1f53": "update_token_list_time",
                "563e50eb822beb18": "leverage_vault_set_profit_taker",
                "eb2f2486626dd470": "crankTokenDistribution",
                "25bfb436e39e7873": "mock_distribute_profit",
                "fb05a9d9f490a0d3": "setPauseRole",
                "8b8aad69dee8d773": "claimWooconfigAuthority",
                "ae6741e3e632cc60": "setLendingManager",
                "11179fd365b829f1": "migrateBinArray",
                "8f0234ceaea4f748": "fulfill",
                "042fc1b1803ee40e": "drift_update_user_custom_margin_ratio",
                "a3d6bfa5f5bc11b9": "closeClaimStatus",
                "cc513d56645ce256": "add_validators_to_blacklist",
                "6dbd1324c3b7de52": "migration_damm_v2_create_metadata",
                "5ecebec07f08ba1c": "initialize_instruction_params",
                "6a278454fe4da1a9": "setLockerParams",
                "2f63a9a79206075e": "consumeFuturesEvents",
                "ca506dd082901ae9": "setFreeze",
                "83f3313282012a9c": "hatchEggs",
                "7d12465f56b3ddbe": "initializeReferralTokenAccount",
                "cfd3639ae67a4aa1": "deleteSnapshotProcessFrame",
                "7cff9972265e1eb9": "updateSrcContractAddress",
                "9297d53f794f091d": "changeThreshold",
                "f98c1bd58082cf71": "unhalt",
                "bc32f9a55d97263f": "fund_reward",
                "731357122983fb7e": "updateAccountMargin",
                "e3f130891e1a6846": "setVotingReward",
                "0b4688a6ca37f64a": "addInstruction",
                "d8ee04a4410ba25b": "pause_market",
                "27ec8c41ac84ffad": "getRepaidCollateralPnft",
                "1172edea9a0cb974": "symmetrySwap",
                "1525fbda6f285405": "postMessageUnreliable",
                "8ffe368a2c0004e7": "overrideVaultBarriers",
                "c0fece4ca8b63bdf": "setCollection",
                "159e42413cdd943d": "oracleInit",
                "ad44300dff007620": "UpdatePluginV1",
                "1b4372f4c47d9275": "haltZetaGroup",
                "1fafd6b475e39835": "perpLiqNegativePnlOrBankruptcy",
                "7e726d16c60c7c4b": "serum3CancelOrder",
                "9e551dd138eb2025": "perpConsumeEvents",
                "59b6e7ce44ad3c06": "createWhitelist",
                "0f299fbb8030fd3c": "initializePriceBasedLiquidityPool",
                "4afa384fceada366": "perpCancelOrderByClientOrderId",
                "2c5ef17418bc3c8f": "setConfigExtensionAuthority",
                "a0a709dc4af3e42b": "depositStake",
                "cfc23884234347f4": "updatePerpMarketImfFactor",
                "aba1455b818ba11c": "updatePerpMarketFundingPeriod",
                "b1b81bc1220dd291": "endSwap",
                "fb659c07023f1e17": "updateUserQuoteAssetInsuranceStake",
                "871aa32bc6dd1d43": "openBookV2Swap",
                "32fe23c561f631a2": "claimDvypass",
                "925e9454ee36ebff": "cancelWithdrawPosition",
                "dea488e35675d54e": "stakeDvypass",
                "342e29f9d537c2d2": "leverage_vault_set_index",
                "a991090f5f047ed1": "updateMainState",
                "6578470408f9d08f": "pause_whitelisted_mint",
                "b896aa6cf971ef91": "swapRaydiumAmm",
                "4b20013a1d7b140b": "toggle_token_flag",
                "f3775e9a7e331a41": "set_treasury_vault_config",
                "8d2a0f7ea95c3eb5": "multisigChangeThreshold",
                "98d6dda6bf2211bd": "meteora_dlmm_claim_fee2",
                "c9cff3724b6f2fbd": "createConfig",
                "3dd8674d3049e50d": "create_repayment",
                "c5b1ea6ff6f8149b": "poolGambaConfig",
                "c3b61054d93adcaf": "initialize_steward",
                "512ab398dd01b578": "riskCheckAndFee",
                "1adab8a52c4c5acc": "deleteSplitReciever",
                "fa49652126cf4bb8": "swap_exact_out",
                "5fdfd470eaf225e5": "updateVote",
                "53146943f84468be": "closeExpiredBid",
                "6142f100463ce377": "setPerpetualMarketAuthority",
                "b5837893dac14344": "depositSolToPair",
                "cf9dbb3fcd951fa5": "UpdateV1",
                "dbcbc7aad42daa50": "unpause_market",
                "a3ace0340b9a6adf": "updateRewardInfos",
                "dac813c5e359c016": "reclaimRent",
                "2e34e1900dd6f664": "configureVotingMintV0",
                "c845ebb6b23e82d9": "setNewTipDistributionProgram",
                "66b6fad9354b9c6d": "initializeNftAttempts",
                "0f56553702e1a1eb": "liquidateV2",
                "eb6d8aad0f2533f4": "updatePricingV2",
                "55ecfd8ffd715657": "setNewStakeAuthority",
                "c21e2cfc605cb003": "castVoteV0",
                "a358ea1f81de0324": "tokenAddBank",
                "44274b8ebf925ede": "initializeZetaState",
                "b2ff39af930dde9a": "mortgageBuyNftSellBondToTokenForNftPair",
                "8df1a6d4f950ecd5": "initializeProgramUsdcAccount",
                "6b0d8dee98a56057": "increaseSize",
                "959e5542ef09f362": "placeAndMakeSpotOrder",
                "a911205acf94d11b": "liquidateBorrowForPerpPnl",
                "9be7747161e58b8d": "settleLp",
                "eb2528c4469236c9": "updatePerpMarketMaxSlippageRatio",
                "6a85a0cec1abc0c2": "setUserStatusToBeingLiquidated",
                "4e5e10bcc16ee71f": "updateSpotMarketStatus",
                "4b2377f7bf128b02": "liquidatePerp",
                "0b44a56212d08649": "withdraw_protocol_fees",
                "8592e4a5fbcf9217": "requestSplit",
                "b7435c3f738fb834": "setCustodyMaxCumulativeShortPositionSizeUsd",
                "ec7de0fb70c1761a": "createSlipV3",
                "16e5ab0cb3a35149": "setOrderDelivery",
                "dd11f69ff8801f60": "lzReceiveTypes",
                "558a638168cb5e04": "close_airdrop",
                "e92233683401cbf2": "withdrawPartnerRevenue",
                "a8a212983a7a7b85": "leverage_vault_safe",
                "b935d17e1f6f0598": "protocol_create",
                "710a0fbef7b83b32": "setReferralFeeRate",
                "337437e7a98444f4": "registerProtocolToken",
                "ad37bc87e6c96097": "claimWoopoolAuthority",
                "0746fa1631018f01": "stake_pool_withdraw_stake",
                "adff94067a638c16": "lock_raydium_liquidity",
                "0c499c47e9acbdc5": "commission_wrap_unwrap",
                "c82fb03fa751dd29": "signal_self_custody",
                "760a8700a8f3df75": "get_unsafe_deposit_id",
                "6cc91e572f4161bc": "lendingPoolAccrueBankInterest",
                "d744484ed0da67b6": "lendingPoolAddBank",
                "0031f60124990b5d": "lifinityTokenSwap",
                "2a85203cabfdb89b": "stop",
                "1be58069737db497": "withdrawTswapFees",
                "e20adef366cd0ddd": "setMakerTreeV0",
                "cab23abee6eae511": "claimTransfer",
                "d45233a0e4507423": "redelegate",
                "dd91b1341f2f3fc9": "consumeEvents",
                "cd85ecadc2459592": "putPairOnMarket",
                "9f9ff5a8bf9a6406": "repayLoanV3Compressed",
                "3fdf2a3b0f806642": "tokenWithdraw",
                "ba2964f8ea513da9": "leaseWithdraw",
                "246c613386068ffd": "unhaltZetaGroup",
                "cceaccdb065b60f1": "openLiquidityPosition",
                "f250a300c4ddc2c2": "withdrawV2",
                "c8531f529c9c1461": "ocpExecuteSaleV2",
                "42d5e9e271f6226b": "tokenURI",
                "c8d6d4281e765bf3": "rollMarketExpiry",
                "6bb2392769737098": "unverifyCreator",
                "52fbe99c0c34b8ca": "claim_fees",
                "75104bf9b37fab93": "positionMovement",
                "aa734d0ba19df7a9": "toggleZetaGroupPerpsOnly",
                "71e1aa41b5d40a21": "solOcpFulfillBuy",
                "dca4d64f237dfc1a": "incrementEpoch",
                "d4d621d328560976": "harvestLiquidity",
                "2cdde397838c166e": "updatePerpMarketExpiry",
                "eac4802c5e0f30c9": "initializeSpotMarket",
                "8e46cc5c496ab434": "requestRemoveInsuranceFundStake",
                "bf038a4772c6ca64": "placeAndTakeSpotOrder",
                "07a68aabceabecf4": "initializePermissionlessConstantProductPoolWithConfig",
                "f608b688bad0f923": "setPoolAllowSwap",
                "65bff3d09a164813": "addCollateralLong",
                "3c70f0ce50655ed2": "issueNotEmittedEntityV0",
                "7f247dada280f6cf": "createParlay",
                "0bb57d43acb2c740": "claimDvypassEmission",
                "794a39decd9b0a89": "earn_vault_set_index",
                "93331fff6f02bdad": "set_numeraire_whitelisted_pool_creator",
                "d42f5f5c726683fa": "openPositionWithTokenExtensions",
                "ad5048628cb1fb08": "createPoolAccounts",
                "27fb829f2e88a4a9": "query",
                "92698569c81303dd": "update_mode_token_metadata",
                "61abe04ea2a4b5e4": "pay_back_liquidity",
                "9c27d0874ced3d48": "claim_platform_fee",
                "3201171987dd9fb6": "poolWithdraw",
                "955fb5f25e5a9ea2": "claimReward",
                "414b3f4ceb5b5b88": "swap2",
                "f192cbd83ade5b76": "close_claim_account",
                "4564a9c17d009645": "set_current_time",
                "6e7059d026745d0a": "execute_relayer_refund_leaf_deferred",
                "5abacbea46b9bf15": "activateProposal",
                "e47f0001e39a36a8": "extend",
                "3de773db51f39e8a": "initializeWhitelistDepositAccount",
                "4bf6d007cb426a5b": "decreasePositionPostSwap",
                "2f42389ccb6b2c94": "lpOperatorUpdateMaxBorrow",
                "8af547e19904032b": "initReserve",
                "1ab4ea703a4108f6": "healthRegionEnd",
                "d8248de1f34e7ded": "mergeStakes",
                "4f7a25a278ad397f": "auctioneerDeposit",
                "f65239e283defdf9": "deposit_strategy",
                "4d12b590db54066a": "initializeCombinedInsuranceVault",
                "ef57d83077de53dc": "oracleQueueSetConfig",
                "0aafd9826f237536": "oracleHeartbeat",
                "1cda1ed1af9b99f0": "add_tokens",
                "ec529e7a0818af91": "solMip1FulfillBuy",
                "841e2333738eba0a": "aggregatorAddJob",
                "437e0ae00979627c": "groupClose",
                "847444aed8a0c616": "createProposal",
                "f21e2e4c6ceb80b5": "setDelegate",
                "8cb003ad17020451": "aggregatorSetAuthority",
                "5e5de2f0c3c9b86d": "transferProtocolIfShares",
                "46acce82e5376e61": "setCustodyAllowSwap",
                "124258c2c53474d4": "perpsV2AddLiquidity",
                "2ad42c5bc63a3cef": "setRateLimit",
                "d98b9c921b6a3a89": "create_huma_config",
                "9bec57e4894b5127": "configTransactionCreate",
                "01dbd76cb8e5d608": "multisigAddMember",
                "a1a21093a5c88c0c": "update_mode_name",
                "372af8e5de8a1afc": "close_policy",
                "4a53971620959a8d": "stake_pool_withdraw_stake_with_slippage",
                "781c3a938c11116e": "earn",
                "f43ffac0322cacfa": "initializeTokenLedger",
                "ab3b8a7ef6bd5b0b": "cancelListingReceipt",
                "9471cf3024fa7884": "createPoolRegistry",
                "7a6ecb0f0875a446": "tokenLiqBankruptcy",
                "2c0c4c90d2d0ef55": "offerLoan",
                "215ef961fafec65d": "orcaSwap",
                "1790d29b08cb5acf": "onboardMobileHotspotV0",
                "a2b6c16166557fbd": "transferV0",
                "281f633453f325c9": "terminate",
                "99a23254b6c94ab3": "setNewAccountAuthority",
                "e19ba7aa1d91a55a": "initProtocolFee",
                "2f4de97576373d71": "resetFarm",
                "61a7906b75be8024": "orderUnstake",
                "e4dc9b47c7bd3c2d": "open",
                "cd20c8b6d6181f90": "updateQuoteSigner",
                "788729dc5e06c286": "RevokeCollectionPluginAuthorityV1",
                "4605845756ebb122": "collectReward",
                "6f7fecf3262035d9": "setVaultFee",
                "293a9909e43bdacf": "createInstall",
                "d18b5ae2f99559d9": "updateTreasuryManagementV0",
                "dae8a47cee3dde48": "mapAgentInstanceOperators",
                "4face18edbc0ab50": "addCollection",
                "7f0a37a47be22f18": "resetPerpMarketAmmOracleTwap",
                "d559d912a037358d": "removePerpLpShares",
                "3283069ce2e7bd48": "updatePerpMarketCurveUpdateIntensity",
                "1f8c43bfbd1465dd": "deleteInitializedSpotMarket",
                "b65700a0c0429782": "createBuyOrder",
                "3439936f38e3217f": "advance_clock",
                "6f0d037b6efd9422": "leverage_config_create",
                "54b2a6a80b61080b": "leverage_vault_repay_borrow",
                "4d1817ebc4027df8": "add_approved_lender",
                "d2555e12828e3b79": "whitelist_mint",
                "3e39cbbfb62437e3": "add_record_before_mint",
                "32ddc75d28f58be9": "multisigCreateV2",
                "75c73e67068e1fcb": "initializePresetParameterV2",
                "cc02c391359191cd": "removeLiquidityByRange2",
                "d71411d683b89b75": "undelegate_node_acount",
                "6c9e4d09d234583e": "rebalance",
                "5f5ffc1a66728ec1": "internalTransferUnlocked",
                "9b227aa5f589936b": "updateSharesMetadata",
                "65d920b45a83f901": "initialize_glympse",
                "2dd69ca31cd9d9ba": "revokeAdmin",
                "0c247c1b806055c7": "reallocStakeList",
                "ebfceea7c7626d53": "getAgentParams",
                "73e6d4d3af3127a9": "addPool",
                "f21d86303a6e0e3c": "openPositionWithMetadata",
                "e9cba5c9af2bbc9f": "burnVaultTokens",
                "a3c456f96074ecc2": "resetLockupV0",
                "8934edd4d7756c68": "createAmmConfig",
                "c1538b7de56f96a4": "lpOperatorCreateNodeWallet",
                "bb51fa5992571440": "repayLoanEscrow",
                "75ff9a47f53a5f59": "tokenDeposit",
                "60155ee2c2357803": "AddPluginV1",
                "1351db1e0a220c50": "initializeDataOnlyV0",
                "d95dae6182b77e2c": "executeTransactionV0",
                "8a23faa3c8ca286e": "remove_market",
                "65a9909c1deda8c0": "buyNftFromPair",
                "556cf6d2f8039fa7": "initializeMintWindowedBreakerV0",
                "aa938ba31368a74d": "settlePositionsHalted",
                "9a54af32b81d5c8e": "createSecurityAgent",
                "f22c18135b3b07c9": "depositInsuranceVaultV2",
                "ef131e786ffcf54a": "drain",
                "6d28285ae078c1b8": "changeOwner",
                "16bf8b88792754ca": "initializeOpenOrdersV3",
                "7eafc60ed445322c": "unwrap",
                "4ec9d74d434da05c": "suspendSsl",
                "b0d169a89a7d453e": "shared_accounts_exact_out_route",
                "53fefd893b7a449c": "removePerpLpSharesInExpiringMarket",
                "fd85431667a11464": "updateUserIdle",
                "eb7ee70a2aa41a3d": "initializeReferrerName",
                "a10fa21394789097": "updateWhitelistMint",
                "30fc7749ffcdaef7": "depositIntoSpotMarketVault",
                "a8cc44969f7e5f94": "resolvePerpPnlDeficit",
                "7e6e34ae1eced75a": "updatePerpAuctionDuration",
                "96874eab9c5ba1dd": "setValidator",
                "0955fb5f5aa79a18": "blacklistAccount",
                "6f3bc7b132e785e4": "merge_delegation_positions",
                "751fe3933b078b83": "initStakingTwo",
                "6914ff45e1f50abd": "getOpenPositionWithSwapAmountAndFees",
                "32c37016fff5e592": "kaminoClose",
                "e5c2d4ac080a8693": "createOpenOrders",
                "13809979ddc05b35": "make_payment",
                "3f8f8c931a454b0a": "insert_token_to_treasury_vault",
                "50cb54359770bbba": "configTransactionAccountsClose",
                "24b5221f164d249a": "drift_update_user_delegate",
                "e126c97b94172f80": "jupiter_vote_increase_locked_amount",
                "f93cfcef8835b503": "kamino_lending_withdraw_obligation_collateral_and_redeem_reserve_collateral_v2",
                "e54353414d54508d": "repay_principal",
                "85ba0f691f4c1f70": "from_swap_log",
                "3a1a82451b516a72": "claim_profile",
                "726cd55caf7c2b13": "initializeUnderlying",
                "f98de1d9a50d49c6": "rolloverVault",
                "9283d496ceeb8186": "syncApy",
                "c33c4c81922d438f": "update_platform_config",
                "9cbe7e97a33ec0dc": "createPair",
                "4040a0d33324b19e": "rescindLoan",
                "a553888e59ca2fdc": "createTree",
                "5c29ac1ebe41ae5a": "swapRewards",
                "b6eb30b3f885d2f0": "forceCancelOrderByOrderId",
                "d72d35a2958a053f": "updateHaltState",
                "3fa9be0a01e1b0c0": "validateAndSellNftToTokenToNftPair",
                "69c00462ec736cc0": "updateValidator",
                "1ff97d6dbffc9e4f": "createFuturesMarket",
                "39729accb921aa88": "referUser",
                "e455b9704e4f4d02": "set_token_ledger",
                "0d7e0d206a07ad95": "verifyCurator",
                "cf32fa43d321465b": "setLimits",
                "a7263b25843c5f44": "cropperTokenSwap",
                "32ae222403a61dcc": "editPool",
                "4331b6ffdea174ee": "vrfPoolRequest",
                "3b6369114977e5fc": "initializeCombinedVault",
                "8bef80b1aa13d38e": "setOptionBarrierAbs",
                "de882e7bbd7d7c7a": "goosefxSwap",
                "eb7fab8b774deb76": "redeemV0",
                "032c47031ac7cb55": "placeTakeOrder",
                "515c7e29fae19cdb": "updateSpotMarketRevenueSettlePeriod",
                "be4fce0f1ae5e52b": "updateSpotMarketOrdersEnabled",
                "a0a2710963bb17ef": "update_pool_authority",
                "944f2f180ddd5694": "updateSusdMetadata",
                "df1752c0e103c2bb": "updateOpenedenInfo",
                "6b2b4980eddc5695": "changeDvypass",
                "64f9bc24c67f07d4": "createDepositPosition",
                "8e8bb0655eaca748": "setAccountList",
                "275ca31b787884bd": "update_receivable_metadata_uri",
                "c3ad9a30667db5ed": "add_strategy_manager_wallet",
                "ffba96dfeb76c9ba": "collect_migrate_fee",
                "434818efdecff0b1": "close_extra_metas_account",
                "33e685a4017f83ad": "sell",
                "5a16714915e52153": "decrease_additional_validator_stake",
                "a8ad4864c962265c": "partner_withdraw_surplus",
                "20dcd38dd1e7494c": "removeAllocation",
                "e02cfe0ad808ac60": "close_instruction_params",
                "4be487ddc819941a": "deposit_now",
                "27025c211fda8ebb": "withdraw_glympse_fees",
                "edd1a92975718eb9": "wormholeReceiveXChainTrade",
                "c738552692f3259e": "bid",
                "51d9b14128e308a5": "updateStrategyConfig",
                "d7f0371b0675d97b": "moveMarketMatchingPoolToInplay",
                "6dcbba10e95b018d": "perpLiqForceCancelOrders",
                "e327d90058031973": "tradingDataAccruedInterest",
                "1e79898b386ddbf2": "swapPhoenix",
                "b3d0be9a20b3133b": "withdrawFromFee",
                "a954da232ace10ab": "publicBuy",
                "9cf0f8291dbd2aad": "updateUnderlyingAmount",
                "1be33826d7bfcf76": "unpause_proxy",
                "eff5cfe2089ac821": "createCollectibleXnft",
                "7013d5ee44719226": "createLiquidityAccount",
                "e0392ce040426ce9": "initializeDepositAndCreateValidationTokenForNftPair",
                "60a22e984893afb0": "setProtocolAuthority",
                "0bc442eb3beddf6f": "rebalanceInsuranceVault",
                "15a05aa3bd7aa432": "tradingOpenAddCollateral",
                "fbf5077bf7320e02": "initializeProduct",
                "4935e61688854f0e": "programStorage",
                "6b123845e43837a4": "settleFundsExpired",
                "08ad2a3d9d5835b6": "issueDataCreditsV0",
                "1beab2349302bb8d": "set_params",
                "fd4dcd5f1be059df": "initializeTokenBadge",
                "c6855829f1773d0e": "updateLpCooldownTime",
                "7a65f9eed109f1f5": "updatePerpMarketAmmSummaryStats",
                "fb90730bde2f3eec": "addInsuranceFundStake",
                "d9cccc76cc82e193": "updateSpotMarketScaleInitialAssetWeightStart",
                "defae5fcda7d3a84": "cleanupPositionStopLoss",
                "08b3786d2176bd50": "lzReceive",
                "0c7054371f93e5f3": "leverage_obligation_clean",
                "c828a26f9cde07f3": "drawdown",
                "5f1ac821246b41db": "set_pool_owner_treasury",
                "a1c26754ab47fa9a": "addLiquidityOneSidePrecise",
                "beabe0dbd948c7b0": "initializeState",
                "003c3c67c95e48df": "price_stakes",
                "55976ef3a4293eee": "manage_collateral_transfer_orca_position",
                "e8dbdf29dbecdcbe": "cancel",
                "51e95b84af1f978d": "complete_authority_transfer",
                "20534f7e9bef683c": "remove_client_from_registry",
                "80e39f8bb0807602": "update_merkle_root_upload_config",
                "b4f8b70b4f77ce41": "fee_withdraw_initialize",
                "2f88d0be7df34ae3": "close_tip_distribution_account",
                "1407a9213a93a621": "transfer_pool_creator",
                "b1ad2af0b8047c51": "raydiumSwap",
                "16b832d53ca8b5e3": "getUnlockedAmount",
                "9a38e280a273e205": "delegateDataCreditsV0",
                "6cd1044815167685": "depositObligationCollateral",
                "63c2a6a2acb62de4": "transferPositionOwnership",
                "6f9865112753999f": "relinquishVoteV0",
                "515588835d50a3f0": "buySingleListingFromTensorswap",
                "2f8ddac05061d174": "rejectTransaction",
                "7f7de20c5118cc23": "meteoraSwap",
                "3d4335c68b84d32c": "healthRegionBegin",
                "18e3e2d45d1af2e6": "pruneExpiredTifOrders",
                "f9c97e677f78b11d": "raydiumSwapExactOutput",
                "4258577127161ba5": "grantAccess",
                "8013dab17fd9bfce": "externalSwapCleanup",
                "d9404c10d84d7be2": "deactivateStakeAccount",
                "37f56c87f7b0f0de": "sweepMarketFees",
                "333161b51a74c5fd": "setBaseURI",
                "c18bff7e5f8690ef": "delegateV0",
                "bad3cdb7735d18a1": "accountEdit",
                "6ab2e2a5535105f8": "setPoolDexMarket",
                "509097151a90daae": "initializeCompressionRecipientV0",
                "fed0761dadf8c846": "editOrder",
                "861ee7c753481b63": "getEntryPriceAndFee",
                "6613df77631509a7": "setFlpStakeConfig",
                "ee998950ce3bfa3d": "updateSpotMarketStepSizeAndTickSize",
                "56d0d81e7f414750": "releaseV1",
                "3a715e8fa196e8c8": "initStakingThree",
                "5b0562364be909ec": "setStopLossShort",
                "415d60a9bed65f03": "obricSwap",
                "0fb64af8fb94baab": "setMinDeposit",
                "fd4de1748849d84d": "extend_remaining_periods",
                "179be835f4195d26": "waive_late_fee",
                "dc3c49e01e6c4f9f": "proposalCreate",
                "8b5ef61ffb85ae68": "setWooAdmin",
                "3c0b9f3b960c6a4e": "gambaSetAuthority",
                "13eab51a67e7f5ef": "deposit_airdrop",
                "21b8c57aa3288a76": "launch_earn",
                "2b4e3dff9434f99a": "marginfiAccountInitialize",
                "24484a13d2d2c0c0": "lendingAccountWithdraw",
                "7802070701dbebbb": "requestLoan",
                "cc1dbf9c0b84873d": "lpOperatorFundNodeWallet",
                "3f5794216d230868": "createOperationAccount",
                "2d5cca4447433304": "initializeReferrerAccount",
                "abcc493b813f863d": "copyVoteAccount",
                "32e521034031c06d": "finishHadoMarket",
                "c2c105c17385e7c5": "forecloseLoanV3Compressed",
                "ff897afdf126ee88": "serum3CloseOpenOrders",
                "7d5dbe8759ae8e95": "unstakeWsol",
                "bc23746c00e9edc9": "takeBidLegacy",
                "00c0e902fcfb82a9": "cancelOrderHalted",
                "b5bf64a6cd0dd583": "closeClearing",
                "0ce6855c96e58d8e": "approveMakerV0",
                "5a87db2aa48661ae": "updatePerpParameters",
                "d8536313dcbf4ac5": "updateReferralAccount",
                "7e384bf3961247b2": "initializeProposalConfigV0",
                "c4c3fabc11ff0a97": "createSplit",
                "0a9730e2f818e3e7": "takeSnipe",
                "18570a73a5be508b": "recenterPerpMarketAmm",
                "8f63ebbb149fb854": "updateUserGovTokenInsuranceStake",
                "475f54a8099dc641": "updatePerpMarketBaseSpread",
                "42b13904dea3ab9f": "dequeueOrderRequest",
                "dbac95d467e6a4b3": "export_position_type",
                "8394b4c65b682aee": "undelegate",
                "5aec440d36ae3af9": "createDvypassEmission",
                "c197cba1c8ca2092": "changeAdmin",
                "666e39b63368b20c": "leverage_vault_create_liquidity",
                "3121681ebd9d4f23": "claim_vested_token",
                "98a06b94f5be7fe0": "create_strategy",
                "ed8e2d178106dea2": "withdraw_migration_fee",
                "2f5e7e73dde2c285": "migration_meteora_damm_create_metadata",
                "38ee12cfc1528aae": "setAccountFlag",
                "4fd1acb1de33ad97": "lendingAccountRepay",
                "047e74353005d41f": "lendingAccountBorrow",
                "7b86510031446262": "close_position",
                "8d3625cfedd2fad7": "createOrder",
                "3c117d2d7380d73b": "resetDaoThreadV0",
                "67d800ee5c6bdb79": "createProgramVersion",
                "38c8348459583f7d": "createBondWithSingleCollateralPnft",
                "664bcb3924f4d0b3": "extractCollateralToLiquidatePnft",
                "cc8d12a108b15c8e": "slash",
                "313cae889a1c74c8": "updateAmmConfig",
                "eb132a0c7162d675": "distributeRewardsV0",
                "4c78ed209fcc15f6": "createPublicClearing",
                "8f4f9ed07d335655": "withdrawAffiliateFee",
                "6634bdff5c4db0f4": "listToTensorswap",
                "0a7c58e957be16b3": "retreatMarketNodes",
                "15d481e7cb62690c": "registerAgents",
                "4d39f6b0587e7c6c": "setClearingAuthority",
                "c829580b2415b56e": "aggregatorInit",
                "2b04ed0b1ac91e62": "swap_v2",
                "d112af10976b5b25": "setMarketRewards",
                "238263bfb79fb7cf": "initializeAndDepositTokenForNftPair",
                "91e52b0cbcf9468e": "setPerpetualMarketStatus",
                "52c1b075b01573fd": "compress",
                "c2f8b361ed18096e": "aggregatorSetResolutionMode",
                "d66efa80897039db": "updateTokenRatios",
                "3daee1a56791fab5": "collectStakeFees",
                "b5bf356da6f9378e": "updateAmmJitIntensity",
                "87846e6bb9a0a99a": "initializePhoenixFulfillmentConfig",
                "3d22759b4b227bd0": "updatePrice",
                "d7693bcd6ccb9e94": "cancelOrderPostMarketLock",
                "5f984f83c913b836": "processOrderRequest",
                "15883902ccdbf28d": "merge_target_positions",
                "e8fa317da6bc7692": "setEnforcedOptions",
                "d98c3a9ca2cd9b24": "earn_config_change_indexer",
                "129a1812edd61350": "setFee",
                "48ca78344d8060c5": "set_owner",
                "d07f1501c2bec446": "initializeConfig",
                "8612136a814461f7": "vaultBatchTransactionAccountClose",
                "6f2ef37590bca26b": "programConfigSetTreasury",
                "42f9152226c5a760": "remove_strategy_manager_wallet",
                "24c54538fe92c03e": "remove_mode",
                "1b51211bc467f635": "create_policy",
                "fdb87ec7ebe8aca2": "create_token_fallback",
                "a93ecf6b3abba26d": "create_claim_fee_operator",
                "51fb7a4e4239d052": "create_dynamic_config",
                "de80f305732dcd35": "refund_user",
                "c84f1029fb5bef53": "idle",
                "d6553443c0eeb266": "pause_steward",
                "acdc33b7025efdfb": "compute_instant_unstake",
                "3688e18aacb6d6a7": "protocol_withdraw_surplus",
                "83c2c88caff4d9b7": "withdrawPendingFees",
                "330aa2eb1d8c6833": "repurchase",
                "73c360d0f9cd381b": "createRoot",
                "4c50c37c91e6846e": "correctTreasuriesV0",
                "e87a7319c78f88a2": "fillOrder",
                "a498cf631eba13b6": "collectFees",
                "10e883739c64ef32": "updateDeactivated",
                "dfafbad401ce52db": "claimBonk",
                "82576c062ee0757b": "updatePoolStatus",
                "9b38d0c61b3d95e9": "stepSwap",
                "c2e2e9660e15c407": "getRemoveLiquidityAmountAndFee",
                "5ef690af04a4e9fc": "addMarketIndexes",
                "6342df5fec831a8c": "phoenixSwap",
                "31ac54c0afb434ea": "postUpdateAtomic",
                "be55f23c775121c0": "depositMarginAccount",
                "169dad06bb19566d": "depositAndInvest",
                "2b42c8d8dbba2c57": "settlePositions",
                "e4ee433545b0b9e3": "aggregatorLock",
                "2d9aedd2dd0fa65c": "initializeLbPair",
                "2b2ef09b50045666": "initializeWhitelistInsuranceAccount",
                "ae32200f8f070b98": "initializeRewardableEntityConfigV0",
                "f4019bd324713cbd": "liquidateSpotPosition",
                "c3679952983b792e": "closeDelegationV0",
                "cb472c94e0f245a5": "withdrawInsuranceVaultV2",
                "da9791370dd7ad3e": "transferWrapped",
                "aff367d0dca92bc1": "closeLiquidityAccount",
                "49905c774a6a10c8": "updateReferralsAdmin",
                "fa49accf9f6ab3b4": "updateActualReturnedAmount",
                "057bbc1a9d5197ce": "rescueLostEscrowlessCollateral",
                "660a5efbd4c1c426": "bumpBytes",
                "93f17b64f484ae76": "create_token_account",
                "e72c2ea9f84aeeb5": "updateLockUpOverride",
                "963e7ddbabdc1aed": "updateActivationPoint",
                "b270c7c43b288c3d": "update_pda_authority",
                "17eb73e8a86001e7": "init_config",
                "0a7de6ea9db8ecf1": "updatePoolAum",
                "185285d449f32e89": "deleteUserProfile",
                "2046b8e5c873e3b1": "setPeer",
                "6c9e9aafd4623442": "set_config",
                "0f62cdc08453902b": "leverage_vault_close",
                "5225cc3adf7c4d63": "earn_vault_withdraw",
                "3db8ec5e2b06acf6": "registerGlobalToken",
                "dcd411835fba8751": "remove_liquidity_asset",
                "fb72ca12d876b056": "remove_pauser",
                "9bc150795b93febb": "initiateDlmmFill",
                "9527de9bd37c981a": "sell_exact_in",
                "e4a24e1c46db7473": "addLiquidity2",
                "b9224ed3c00da025": "force_transfer_tokens",
                "6bb4d43f92009fff": "queued_subscribe",
                "6729862b8c98fd4a": "refinance_ledger",
                "4c468e7b5095c017": "unclaim_profile",
                "95cb721c508a1183": "set_staker",
                "9ca9e66735e45040": "migration_damm_v2",
                "0df5b467feb67904": "invest",
                "0153ff3be83740d8": "bridge_tokens_to_hub_pool",
                "ea1654d676b08caa": "lendingAccountWithdrawEmissions",
                "092c2e0fa18f1536": "auctioneerExecutePartialSale",
                "36aec14311298426": "list",
                "f3d504ec1af6b4ae": "collectTreasuryFunds",
                "b2280abde481ba8c": "wrap",
                "7eea6ba143d06b78": "redeemFbondsFromAutocompoundToUser",
                "ebfcc8baa8e98ae9": "acceptAdminUpdate",
                "60001cbe316b53de": "buyNft",
                "8cbdd117ef3eef0b": "close_pool",
                "b5eaf14531924100": "closeMarketPosition",
                "a026d06f685b2c01": "decrease_liquidity",
                "a38e2b6ed0536302": "closeFuturesMarket",
                "e202be65ca849c14": "flashSwapUnevenVaultsEnd",
                "2680473650ed14bf": "pdaEscrow",
                "63148277c4eb8395": "createAccount",
                "728025a747e328b2": "reallocPool",
                "f5dc694975624e8d": "buySingleListing",
                "11a42ade97a018b5": "serum3DeregisterMarket",
                "8730d0ca61074b2c": "prunePerpOrders",
                "96564774a75d0e68": "route_with_token_ledger",
                "eb6d0252db76069f": "moveAmmPrice",
                "13ac729a2a87a185": "updatePerpMarketMaxFillReserveFraction",
                "b6b2cb48bb8f9d6b": "updateSpotAuctionDuration",
                "78590b197a4d48c1": "settleExpiredMarket",
                "566cf65d582f725a": "raydiumClmmSwapV2",
                "9124a1e0b26a4f34": "closeDvypassV2",
                "06c7b168563d5dfd": "set_numeraire_owner",
                "127a049fdaba5877": "submit_receivable",
                "94e8a756e1ff39c9": "swapOpenbookV2",
                "d78219b6caf04d95": "confirm_gt_buyback",
                "fedb0dd3b813522f": "give_rewards",
                "692565c54bfb661a": "execute",
                "c447bbb00223aaa5": "vaultTransactionAccountsClose",
                "0bf29f2a56c55973": "multisigAddSpendingLimit",
                "cc9ec015db199a57": "jupiter_vote_toggle_max_lock",
                "abde6f253ca6d06c": "add_mint",
                "ce820d9caa2d6073": "meteora_dlmm_initialize_position_pda",
                "d316ddfb4a79c12f": "pause",
                "b459c74ca8ecd98a": "deploy_bonding_curve",
                "3e65268e864f7a74": "check_node",
                "46036e1dc7becdb0": "uploadMerkleRoot",
                "705787df53cc8435": "setPoolStatus",
                "14d40fbd45b44597": "castVote",
                "37f1cddd2d72cda3": "partialUnstake",
                "2c6fa5b93a0ef9f9": "setTestOraclePrice",
                "a47b8ee9438e4794": "transferProject",
                "c681d8b9f71d69be": "initializeWhitelistTradingFeesAccount",
                "c1995fd8a60690d9": "settleMarket",
                "adbc23d7b6ed9e07": "closePositionV0",
                "88b8323ab75c3fd8": "forecloseLoanV3",
                "db8015ea162ceed7": "getAgentInstances",
                "3eecf81cdee8b649": "marinade_deposit",
                "1956817cb8c38659": "setCanopyV0",
                "71124b08b61f69ba": "collectFeesAndRewards",
                "3788cd6b6bad041f": "delist",
                "514ee03cf4385aef": "flashLoanBegin",
                "89f547592ef91635": "editDelegatedPubkey",
                "4cd3d5ab754e9e4c": "lendingPoolAddBankWithSeed",
                "91306de3222546c9": "initializeHadoMarket",
                "4150907170b2ee32": "unstakeGemFarmStaking",
                "de334efc0d9788ad": "updateSplitReceiver",
                "5bf660073516eae1": "placePerpOrderV3",
                "662c9e36cd257e4e": "setPoolFees",
                "ebfd20b0915ea2f4": "mangerCancelWithdrawRequest",
                "ee24343972b61af7": "updateMarketExpiration",
                "20e3cf7f70321f9d": "initializeLazyTransactionsV0",
                "ccb5afde287dbc47": "createOpenOrdersAccount",
                "f3f8d58fb84f2949": "placeOrderV4",
                "a030b8390569e947": "distributeCompressionRewardsV0",
                "5d7c10b3f98373f5": "initializePositionBundleWithMetadata",
                "2a12f2e042207a08": "initStaking",
                "5a89099129089475": "updatePerpMarketLiquidationFee",
                "e2fd4c471102aba9": "updateSpotMarketFuel",
                "2890c63b19934899": "allocateBlacklist",
                "aa2c7b5b2242293d": "createOrderRequest",
                "0c945e2a373953f7": "setWhitelistedVault",
                "73bc70cee9f6e7a6": "increasePositionShort",
                "d0d450a92494d123": "oneIntroSwap",
                "2fa41c5b482ac715": "changeBeneficiaryFee",
                "96bec0cd765a401a": "leverage_vault_confiscate",
                "5215ed49309956a8": "withdraw_after_pool_closure",
                "7b72817d4149a511": "setWooState",
                "9e9aa1a360030063": "repayByLendingManager",
                "03dd95da6f8d76d5": "addLiquidityByStrategy2",
                "104c8ab3ab70c415": "update_strategy",
                "d295802dbc3a4eaf": "set_coin_creator",
                "132c829448382cee": "proxy_swap",
                "728de3dccfc99e14": "us_platform_fee_spl_proxy_swap",
                "a120d5efdd0fb572": "remove_validator_from_pool",
                "bf60f52e3f49cf11": "issueDataOnlyEntityV0",
                "30bfa32c47813fa4": "initializeVault",
                "08cee60edf6af223": "updateMarketTitle",
                "3d980a4dc4f25924": "initializeValidatorHistoryAccount",
                "02569a9c167e4d5d": "customValidateNft",
                "5185fd9f5dfcf404": "sellCnft",
                "5266264387c7842e": "tokenDeregister",
                "0443514088f55d98": "updateActive",
                "6de6e02f28465a94": "distributeV0",
                "a7e9e6e8bbbf1ed3": "cancelSpotOrder",
                "3dcf3f9ddfa391b1": "initializeCollectionInfo",
                "d9e8ed9b4d0e438f": "agentCreate",
                "ec62440023fe7bc7": "delegationCreate",
                "6c514e757d9b38c8": "depositSol",
                "29780f0071db2a01": "marinadeUnstake",
                "493748b8929868ad": "closePerpMarket",
                "e97f67bd47f17fb2": "CompressV1",
                "f0ab8d697c02e1bc": "setAdminSigners",
                "457d73daf5baf2c4": "swapRouterBaseIn",
                "e39ec8a87a688551": "createTick",
                "35f38941088c9e06": "setFeeRate",
                "d8a415fc617392df": "updateSubDaoV0",
                "5b014d32ebe58531": "initializeRewardV2",
                "c30478bc9301e680": "createTradingAccount",
                "5c23855ee6460e9d": "update_voter_weight",
                "4ff1cbb1e88f7c0e": "joinDaoLlc",
                "e072923c7fa6f438": "openPositionLong",
                "8476e689f1c1885d": "liquidateLong",
                "fe8c1835c5ea2379": "claimStakes",
                "2520772a7e7443a8": "resolveBatchWithdraw",
                "83f285d3c6483d5f": "emergencyTransferRwaToken",
                "364b35d92f7a60fe": "swapLifinity",
                "30a94c48e5b437a1": "transferAuthority",
                "e4c6886f7b04b271": "multisigRemoveSpendingLimit",
                "2e527d92558de499": "initializePositionPda",
                "b364cc00c02ee9b5": "stake_pool_withdraw_sol",
                "f87b515e890a4f51": "meteora_dlmm_add_liquidity2",
                "3f80a9ce9e3c8730": "stake_split",
                "b37614d491923182": "drift_delete_user",
                "4e2cad1d84b404ac": "create_raydium_random_pool",
                "0a333d2370691855": "removeAllLiquidity",
                "b4269a118521a2d3": "claim_position_fee",
                "438e36d81f1d1b5c": "exchange2",
                "0d09d36b3eace043": "initFee",
                "e05d904d3d118936": "repayLoan",
                "c56198c473cc40d7": "auctioneerCancel",
                "a9204f8988e84689": "claimFee",
                "fc681286a44e128c": "flashFillOrder",
                "c190af09d939e8c4": "moveMarketToInplay",
                "d02fc29b116252ec": "Collect",
                "d857417d716eb978": "setPoolConfig",
                "3696817e87cd9578": "withdrawMmFee",
                "b594ef90830da117": "withdrawFromReserveFund",
                "90289321ee5c582e": "vrfLiteInit",
                "5e9b6797465fdca5": "addLiquidityOneSide",
                "bf678df050816799": "quit",
                "4fc7187a68d36c18": "createOracleStub",
                "869129ebf1c853de": "settlePositionWithDelivery",
                "2435e7b807b505ee": "saberAddDecimals",
                "85f5c0f1cabf824d": "transferNftFromBnAcc",
                "e694ed737e37e2ac": "createSubAccount",
                "3feb09c9a3abce21": "initializeProposalV0",
                "333091737b5f478a": "tokenSwapV2",
                "a29b94795b410260": "activateStake",
                "61eb4e3ed42af17f": "cancelRequestRemoveInsuranceFundStake",
                "614c42db6db10543": "setCustodyAllowTrade",
                "f802f0fd11b83908": "moonshotWrappedSell",
                "00fb8f8fdb9cbf6d": "kaminoClaimRewards",
                "bc7679d4c122b802": "closeDvypass",
                "dc749f5d34d9acd1": "leverage_vault_liquidate",
                "2734cafd83a32a10": "migrateRaydiumCpSwapToGamma",
                "c693e57e8777864d": "transfer_receiver",
                "75e89208faba3c02": "incaseTokenGotStuck",
                "678a5c3942c22817": "setWooPrice",
                "4a62c0d6b1334b33": "swapWithPriceImpact2",
                "9daf0c13ca721124": "drift_update_user_margin_trading_enabled",
                "f62de3ad0f335501": "create_market_information",
                "bd47bdef71423bbd": "close_bonding_curve_vault",
                "7523eaf7ce83b695": "closeVoter",
                "5c72d6310df34923": "pause_fills",
                "be9aa399a87328ad": "mergePartialUnstaking",
                "f1241d6fd01f68d9": "withdrawFunds",
                "f163c24c067e319a": "BurnV1",
                "ee40a3604bab1021": "settleFunds",
                "493f8a3bcd45ef9d": "updateMaxDepositLimit",
                "0bfb0ca1c7e48557": "settleFunding",
                "080fc6aa617cfa65": "postVaa",
                "c0957457f0740aa3": "writeToLegacyInscriptionAsUauth",
                "ad3d5fa348074519": "updateDataCreditsV0",
                "11066548fa179860": "setLocker",
                "154305004aa833c0": "aggregatorSaveResult",
                "9f276e8964eacc8d": "executiveWithdraw",
                "28611cc819e3c135": "deleteSplit",
                "38df4e99ff441e7e": "claimFbondsFromAutocompoundDeposit",
                "490310a88fe2c9fe": "managerDeposit",
                "b855c71869ab9c38": "createIncreasePositionMarketRequest",
                "2989b97e458bfe37": "addMarket",
                "fef34862fb82a8d5": "initializeUserStats",
                "d00bd39fe2180bf7": "updateSpotMarketExpiry",
                "6eda61ed6f802d16": "leverage_vault_keeper_pay_liquidation_fee",
                "ea8dbeecdd59098f": "buy_token_exact_in",
                "41e033966be3303b": "claimWooammpoolAuthority",
                "88bbe4c1a86b7190": "add_mode",
                "27195f6b7411731c": "closePresetParameter2",
                "398b2f7bd850df0a": "setPreActivationSwapAddress",
                "f70392e923bdc0bb": "jupiter_vote_cast_vote_checked",
                "4442764f0f90bebe": "stake_initialize",
                "5434cce4188cea4b": "create_token",
                "2316e8fa3c1e3e53": "update_node_online",
                "6982481958b96437": "poolMintBonusTokens",
                "afc8378d08bfc7ee": "us_platform_fee_sol_proxy_swap",
                "894855bb4a6fed88": "init_pregrad",
                "71998decb809870f": "configureVotingMint",
                "f5362904f3ca1f11": "lendingAccountCloseBalance",
                "959e62ba40d33411": "updateMakerTreeV0",
                "41c8cf3b54d1472f": "liquidateFuturesPosition",
                "273a2680643ebff9": "whirlpoolSwapExactOutput",
                "00a4564c38480caa": "withdrawFromTreasury",
                "7dbb4acb2476c43e": "addToDepositQueue",
                "94a14b578a22833e": "extendLoanV3Compressed",
                "6b1d5fc8d9349b4c": "reinvest",
                "c6d4ab6d90d7ae59": "withdrawFees",
                "58d41f74fdc95101": "accountExpand",
                "438561dfb2bcebb5": "crankEventQueue",
                "81c575726c77cf88": "overrideExpiry",
                "43b5e9d6d794f57e": "realloc_state",
                "45a15dca787e4cb9": "placePerpOrder",
                "70035c4ca241c2d2": "buyFromMagiceden",
                "8331f04dd237701f": "closePriceLadder",
                "a6ce1d9d4990a429": "issueRewardsV0",
                "27829ded236ce768": "setClearingFeeMint",
                "8a9ba9d2f41052fb": "agentClaim",
                "99a0dac64d76c0cc": "makeLiquidityPairTokenized",
                "ba633dbd6f18380a": "ApproveCollectionPluginAuthorityV1",
                "01d450a8813c2efb": "removeFreeze",
                "925d0ea79f14063a": "placeOrderV3",
                "2227b7fc531c557f": "setRewardAuthority",
                "9a2950e8ae30f623": "solWithdrawBuy",
                "7554404c891fbc1c": "tempPayMobileOnboardingFeeV0",
                "0743e3aa16f88a11": "baseURI",
                "7305c01c56dd8966": "accountClose",
                "bf44d1980a5ea50b": "vrfLiteProveAndVerify",
                "a45482bd6f3afac8": "updateGlobalConfig",
                "ab1ccb1d7610d6a9": "decreaseSize",
                "8409e5767576753e": "initializePerpMarket",
                "ab6df0fb5f019559": "updateSerumFulfillmentConfigStatus",
                "b96108d076cda602": "slash_account",
                "69188313c9fa9d49": "create_stake_account",
                "177c9f7698384f03": "cancelDepositPosition",
                "89cac078f0e7e9c0": "setStablecoin",
                "30fa4ea8d0e2dad3": "vaultTransactionCreate",
                "c28e8d1137b914f8": "batchCreate",
                "6c65e760536efc2e": "setStaleDuration",
                "ae5a2373ba2893e2": "closePosition2",
                "e992d18ecf6840bc": "createPool",
                "b5061d19c0d3bebb": "add_validator_to_pool",
                "f6c85ae7851619dc": "internalTransferLocked",
                "16224fea08380228": "withdraw_curve",
                "b595fe0ae25d2d6d": "worked",
                "27eeaafd17bcfd6e": "updateSubDaoVehntV0",
                "2f2b37dc2d95c61d": "set_trader",
                "f38449523adc120e": "increasePriceLadderSize",
                "d19d35d261b41f2d": "updateLendingMarket",
                "0902a0a9760ccf54": "updateUser",
                "cd5482b43f760acf": "placePerpOrderV2",
                "f1fc0e05f58002ac": "serum3CancelAllOrders",
                "df346ad93ddc24a0": "removeCollection",
                "15994b0c17521f5d": "rejectLotTicketByAdmin",
                "cbd4085a5b766f32": "initializeKaminoReward",
                "78791792ad6ec7cd": "mintV2",
                "ab39e796a7801237": "removeMember",
                "ca468d1d888ee676": "leaseExtend",
                "30bd4824c71995bf": "newPerpOrder",
                "6529ce21d86f194e": "setValidatorScore",
                "5e529ab1c1cd8d4c": "setCustodyGlobalLimit",
                "ac4fcf11f3d6f2c6": "cancelPerpOrder",
                "02da8aeb4fc91966": "refreshReserve",
                "7877bf4aadbdb74a": "registerForeignHashflowChain",
                "fd2d639f017c842b": "increasePositionLong",
                "16a147f57129d7ea": "setToken",
                "47a11be6d0cecdf9": "oappQuote",
                "ee30529b408f2d67": "declare_payment",
                "941042e4205728d7": "initializeAgPrice",
                "e33d820275e24e01": "kamino_lending_init_obligation_farms_for_reserve",
                "dbab9fcaa7c0d119": "meteora_dlmm_add_liquidity_by_strategy2",
                "b712469c946da122": "withdraw",
                "9c838e7492f7a278": "deposit_collateral",
                "5fb40aac54aee828": "initializePool",
                "01ce0d081b3db231": "execute_self_custody",
                "fd3065ed6d0e99d0": "remove_validator_from_blacklist",
                "52dcfabd03556b2d": "claim_creator_trading_fee",
                "37d5e0a89935c528": "lendingPoolUpdateEmissionsParameters",
                "6711c819765f7d3d": "setCollectionDuringMint",
                "b6364926bc57b965": "detachPoolFromMargin",
                "b80c569546c461e1": "redeem",
                "b0689a69fa5044f4": "withdrawShares",
                "24e2a98744546810": "updateHashflowFeeCollector",
                "3ee801124b074d9e": "setReferralsRewards",
                "8fbe5adac41e33de": "swapBaseInput",
                "689d407748a9d51b": "sweepPoolFees",
                "1c8cee63e7a21595": "addLiquidityByWeight",
                "791961c7594d2628": "updateRegistrarAuthorityV0",
                "57d917b3cd197181": "stakeReserve",
                "1d16d2e1db72c1a9": "initPlatform",
                "e7ad315beb184413": "executeTransaction",
                "ed215cdedc062acb": "createOpenOrderV2",
                "be3d7d57674f9ead": "increaseOracleLength",
                "af7710f58d37ff2b": "unlockFunds",
                "5951b44f8e9042fb": "claimUnlock",
                "5dda9dd41693b4c4": "createPermissionedInstall",
                "da0be05bf39c0805": "overrideObservationPeriod",
                "673c3d4f383d4c31": "transfer_fees",
                "3e21624a305a32a1": "calculateCurrentYield",
                "68558b7da5fe5622": "initializeNftAttemptsByStaking",
                "6640d7cff3712b85": "closeVirtualNftSwapPair",
                "e39afb07b438648f": "printPurchaseReceipt",
                "a21bdcef57e34079": "exists",
                "6780de8672c816c8": "collectProtocolFeesV2",
                "7f52792aa1b0f9ce": "addCollateral",
                "1c9a14f966c04947": "updateLiquidationDuration",
                "9908168a69b05742": "withdrawStake",
                "31d4bf8127c22bc4": "invokeCpi",
                "7cc21ee559eb5e26": "setPoolAumSoftCapUsd",
                "a0c3e6d655d0bab8": "patchStakingRound",
                "17a91b7a93a9d198": "createTokenPool",
                "ff136363284153ff": "pumpdotfunWrappedSell",
                "d88834c86d4b63f5": "closeBetV2",
                "e412a3a165cc6aac": "init_virtual_stable_pair",
                "38d98e5fcb072542": "set_evaluation_agent",
                "0ab1a1eefa257818": "unrestake",
                "949a794dd4fe9b48": "multisigSetTimeLock",
                "2b220d31a758ebeb": "initialize_extra_metas_account",
                "a039592ab58b2b42": "collect_coin_creator_fee",
                "49f5f279e71bfa95": "create_drawdown",
                "ef19a64551a58ef7": "change_borrower",
                "899893a40e1121f1": "complete_pregrad",
                "69458234c41cb078": "distribute_tokens",
                "8a59e486e9b3e1d1": "freeze_nft",
                "4f237a54ad0f5dbf": "addImbalanceLiquidity",
                "8006e48337a134a9": "enableOrDisablePool",
                "896dfdfd466d0b64": "balansolSwap",
                "f5633b199747e9f9": "depositLiquidity",
                "aa2ea578df667302": "closeRequest",
                "6b52a5bb2af81559": "setProductState",
                "ea4026dfe0d81d52": "updateStateV0",
                "f9ec474a683ae11c": "updateRewardTokens",
                "65753b36173c9a79": "updateTenorInDays",
                "c814006a38d2e68c": "getOraclePrice",
                "b1ec21cd7c9837ba": "addAdmin",
                "5c12439c1b97b7e0": "requestGovernanceAuthorityTransfer",
                "b1479abce2854a37": "liquidateObligationAndRedeemReserveCollateral",
                "4b841106f79d7561": "addCollateralBox",
                "f0d9358e45cc930d": "seizeNft",
                "3d9464468f6b110d": "updateReserveConfig",
                "457ed725143c49eb": "initializeProject",
                "62cea92ccc0a2f6f": "claimExcessRentAsUauth",
                "9de1d0961799fd12": "updatePricing",
                "e4dfae43bcd110c5": "createOracleProducts",
                "b944c1e83d993f00": "sellToTensorswap",
                "5f0704329a4f9c83": "setProtocolFeeRate",
                "6ab20c7a4aadfbde": "delegateAuctioneer",
                "fac674fcfd7c25b9": "deleteSnapshotProcessEntry",
                "6f4ce83227af30f2": "cancelRedeem",
                "f0b6c83cd136b4f0": "setSuspended",
                "3bf5b6650cf822d5": "liquidateNftToRaffles",
                "7514720795a5da9b": "setProductDepositQueue",
                "682741d2faa36486": "updateUserOpenOrdersCount",
                "8784cda56d96a66a": "updatePerpMarketUnrealizedAssetWeight",
                "4bca01047a6e6694": "approveProgramLockPrivilege",
                "693aa60463fd73e1": "update_reward_program_authority",
                "b1ac115dc15636de": "acceptSplit",
                "8a8ba786d05b8a9e": "pumpdotfunWrappedBuy",
                "ae9e2557a575c457": "closeParlay",
                "3a9cde79e199f6bd": "swapTokensForStable",
                "9cf4f8c91eb0db6d": "leverage_vault_release",
                "cef2d7bb8621e094": "flashTakeOrderEnd",
                "4a268c81e449ec69": "set_whitelisted_adder",
                "b7ae4d28b686cad5": "batchThawLstAccounts",
                "fb7d43cbe098c5ac": "whitelistMarket",
                "1b2a7fed26a354cb": "proposalCancel",
                "8436fa47f4cfc1a3": "tryQuery",
                "1901b865c8f5d2f6": "close_state",
                "f05bd1599b006185": "price_drift",
                "b96840616cf3efa5": "stake_pool_deposit_stake_with_slippage",
                "a6facb94433ccf33": "price_meteora",
                "45a4d25992d6ad43": "platform_fee_spl_proxy_swap_v2",
                "33c29baf6d82606a": "placeOrder",
                "5f42ee2667a5b20f": "start_refund",
                "b137ee9dfb58a52a": "migrate_meteora_damm_lock_lp_token",
                "40bc81ff40818b66": "patchOrderGive",
                "d0779091b23969fc": "initializeStrategy",
                "4a5a056f23ab8738": "tradingCloseRepaySol",
                "218493e497c04859": "refreshObligation",
                "5e1f9ffc90430464": "senchaExchange",
                "43248f7624a45cd9": "deploy",
                "6256cc335e4745bb": "overrideCurveParam",
                "7bd7fc1bb8f497c5": "updateReferral",
                "4a3b80a057ae99c2": "createFarm",
                "5f61d7cc6f33ccb8": "cancelOrderNoError",
                "594cd010a5a890e4": "setVaultRatioCache",
                "11e3183b00d4d0de": "CID_PREFIX",
                "5062de079b5604a7": "updateMarketEventStartTimeToNow",
                "d1e336046dac2947": "consumeGivenEvents",
                "489a0f1ca5d7d1c7": "initializeCrossMarginAccountManager",
                "58ed81a2bfbfb558": "modifyPair",
                "471b11834e493e5c": "extendLoanV3",
                "4a0c5dbec7d5c318": "sellNftToLiquidityPair",
                "0c19428b166066c1": "accountBuybackFeesWithMngo",
                "7117c72919cbea1e": "sellRemainingAccounts",
                "c02ae7bd23ac3309": "bufferRelayerOpenRound",
                "beca678aa7c51909": "updateDelegate",
                "fb3c8ec379cb1ab7": "auctioneerSell",
                "6dc64f7941caa18e": "stubOracleSet",
                "db5f400a3789856d": "TransferV1",
                "8d17158a3271273f": "depositNftToPair",
                "5b3fcd901453b178": "initializeMarketIndexes",
                "fbedbe80e4c35def": "setCurrentRewardsV0",
                "7c332f5a44421962": "altExtend",
                "9223fefc22ccdd85": "burnDelegatedDataCreditsV0",
                "70aea2e8595ccda8": "initializeVaultDepositor",
                "38bf4f121a7950d0": "updateSpotMarketMaxTokenDeposits",
                "5f6f7c6956a9bb22": "liquidatePerpWithFill",
                "f4f341fb63ebed4e": "initOneCore",
                "ff5bcf54fbc2fe3f": "freeze",
                "5ed6e86f8e3d7b1d": "stabbleWeightedSwap",
                "79de7fc3b3d424ef": "changeDvypassFee",
                "e8f2c5fdf08f8134": "createTokenLedger",
                "22a4c51a2c845f04": "configureTokenDistribution",
                "5cc5aec5297c1303": "initialize_extra_account_meta_list",
                "48cbc9114b3c9d2f": "add_redemption_request",
                "c6e74416fc2edf02": "sync_gt_bank",
                "f1455410a4e8834f": "remove_minter",
                "cba74157d0a15bcf": "merkle_distributor_new_claim_and_stake",
                "3c896beb6bd1136a": "meteora_dlmm_add_liquidity_one_side_precise2",
                "2eb57d0c33b386b0": "stake_merge",
                "74cf00c4fc78f312": "jupiter_swap",
                "078da23c47731a92": "approve_strategy",
                "e857480e5928281b": "initialize_merkle_root_upload_config",
                "095ed80e74ccf700": "refresh_vesting",
                "813b450a844c2314": "commission_sol_from_swap",
                "8b85021e5b917f9a": "migrate_meteora_damm_claim_lp_token",
                "66ceed6a3f8d2af8": "set_cross_domain_admin",
                "35bc6dd273220509": "extendLoanEscrow",
                "71d87a83e1d11637": "initializeGlobalConfig",
                "37ea1052642a7ec0": "initializeOpenOrders",
                "9be82fab7cce851b": "listCollateral",
                "3e2728a12de186a6": "updateTokenIndex",
                "4f8e22e13873abcd": "attestToken",
                "b73528fd810d4368": "initializeSubDaoV0",
                "7f3fa1c88e9536f8": "transferToProductUnderlyingTokenAccount",
                "b74a9ca070022a1e": "initializeFeeTier",
                "61174b078cc4d1ab": "calculateKickoffV0",
                "8e89a76b2f27f07c": "initializeCandyMachine",
                "d12ac3048155d12c": "initializeMint",
                "1b1ae432d2d3cd5e": "initializeCrossMarginAccount",
                "dbc0ea47bebf6650": "initializePosition",
                "ada8bc6bf11dff71": "initCacheAccount",
                "5df78644673ccc8c": "liquidatePerpPosition",
                "9912b22fc59e560f": "mintToCollectionV1",
                "a39fa319f3a16c4a": "heliumTreasuryManagementRedeemV0",
                "931ee02212e66904": "updateSpotMarketIfFactor",
                "c8e89dc2e8ebb70f": "initThreeGovernance",
                "caa0a54e8eed273b": "finalizeLockedStake",
                "f41b0ce22df7e62b": "closeOrderAndClaimTip",
                "7bde7cb7672bfb61": "remove_approved_lender",
                "2323bdc19b30aacb": "initialize_market",
                "981232d52d0b6f68": "mint_sld",
                "7340e24e21d369a2": "fulfillFlashFill",
                "39948544fde0fb5d": "setPoolCapBal",
                "1180a0e290b44acf": "setPoolMaxGamma",
                "18d3742869039938": "buy_exact_out",
                "563bba7bb7b5ea89": "drift_withdraw",
                "5d786a70282d5420": "kamino_lending_deposit_reserve_liquidity_and_obligation_collateral_v2",
                "f30a6eaa47fbd257": "create_timelock",
                "6f5c8e4f21ea521b": "clawback",
                "ca38b48f2e686a70": "closeDistributor",
                "279da5bb58d9cf62": "request_slow_fill",
                "a13a88aef2df9cb0": "lendingAccountSettleEmissions",
                "79a7a8bfb4f7fb4e": "vrfSetCallback",
                "2f2a9ce4f9a3feb9": "withdrawSell",
                "326a426863769158": "changeAuthority",
                "456316470be7568f": "changeTipReceiver",
                "a36c9dbd8c500d8f": "newVote",
                "6a4a809213412717": "cancelProposal",
                "6e18a4f76c6a941e": "paybackLoan",
                "90df8378c4fdb563": "initializeOracle",
                "6baa5d8bc08d79cd": "perpLiqBaseOrPositivePnl",
                "4d1addee85c956ac": "upgradeOracleProducts",
                "aa13e8acc6683cc8": "marinadeFinanceLiquidUnstake",
                "08a0c9e2d94ae489": "createIncreasePositionRequest",
                "37d96256a34ab4ad": "swapBaseOutput",
                "04e4d747e1fd77ce": "bootstrapLiquidity",
                "45e3625dedcadf8c": "raydiumSwapV2",
                "857daf16cf5fff5b": "withdrawSolFromFlashLoanPool",
                "b0780b0c4d1d8827": "distributeRewardsProcessEntry",
                "38dfa5f596ecad25": "updateLazyTransactionsV0",
                "3013fed1c8d3313d": "resetNumFlexUnderlyings",
                "b1ce9a8d03f88010": "mip1WithdrawSell",
                "0858b7f9a67337e3": "groupEdit",
                "db18ec6e8a508106": "removePosition",
                "3cd07993f26a0bfe": "updateZetaGroupMarginParameters",
                "34659a499b9e1c8d": "deployMigrated",
                "45050737afcc8609": "resizeLegacyInscriptionAsUauthV3",
                "3ff6884c74561033": "tempUpdateSubDaoEpochInfo",
                "80edd83b7a3e9c1e": "setMarketConfig",
                "3e5744731d9696a5": "updatePerpMarketTargetBaseAssetAmountPerLp",
                "2c1de4e628917348": "updateMarketLocktimeToNow",
                "55c99a5c851f8e55": "cloneSwap",
                "41b1d749352d632f": "transfer_ownership",
                "258d98d38ecf206c": "update_pool_basic_config",
                "aec166116f83901d": "remove_record_before_mint",
                "39a57a1a8394ea63": "remove_record",
                "885cc8671cda908c": "migrate_to_cpswap",
                "9d368a4d10ef6410": "meteora_dlmm_remove_liquidity_by_range2",
                "262833c382f886f7": "claim_vault_fee",
                "0950868ad4143d2a": "withdraw_user_vault",
                "58ce005b3caf9776": "create_token_badge",
                "b983a7ba9f7d1343": "createDepositEntry",
                "12eda6c52210d590": "collectRemainingRewards",
                "b172e222ba9605f5": "initializePair",
                "f7fe7e111a06d775": "addCustody",
                "4abeb9e15869d19c": "mip1CancelSell",
                "8707ed78955e5f07": "withdrawVault",
                "ddef63f0562ed57e": "auctioneerPublicBuy",
                "492b45c0748ae2cd": "settleMarketPosition",
                "40b5c43fde4840e8": "forceCancelOrders",
                "2f9de2b40cf02147": "initializeBinArrayBitmapExtension",
                "b01ad6ac88784dd7": "updateApr",
                "dd42f29ff9ce86f1": "createAuctionHouse",
                "b18575ae98b8f1eb": "setFuturesMarketParams",
                "9dd177797d2dafa1": "updateDaoV0",
                "9e595efd7811782f": "mip1DepositSell",
                "bc4b1ec6632b0c36": "withdrawBuyback",
                "91834a8841892a26": "withdrawSol",
                "434aaa847de9b625": "finish",
                "2f6d1c06cc04f649": "createPrivateClearing",
                "d73bda855d8a3c7b": "reallocValidatorList",
                "4205ae3d8108bed4": "swapRaydium",
                "3f7033e9e82ff0c7": "triggerOrder",
                "9109489d5f7d3d55": "close_config",
                "f0dff6761a792280": "recover_account",
                "07ffa6005623c56a": "mintLmTokensFromBucket",
                "aa171f2285ad5df2": "revoke",
                "a5d0fb4ef2a08d2f": "compound",
                "b6b0970663fc8ea5": "set_create_market_config",
                "b8bcc6c3cd7c75d8": "programConfigInit",
                "1039827fc1149b86": "spendingLimitUse",
                "9beae792ec9ea21e": "migrate",
                "0f843b32c706fb2e": "migratePosition",
                "ac636c0e5159e4b7": "drift_cancel_orders_by_ids",
                "45c8fef7283476ca": "platform_fee_sol_proxy_swap_v2",
                "1b013016b43f76d9": "migrate_meteora_damm",
                "1f489fe8dc995a6d": "updateOrderBook",
                "9bafa0120793f910": "crankPush",
                "54d702acf100f5db": "updateAuctionHouse",
                "dc3bcfec6cfa2f64": "init",
                "8e883f418687d213": "externalSwapSetup",
                "50256d88528759f1": "configUpdate",
                "a2070bb5c63cbfca": "claimIdoProceeds",
                "d82333ab98293e6a": "initializeRecipientV0",
                "8be7ef4a24689a03": "authoriseOperator",
                "f98fc27ad9dfb485": "closeSpotOpenOrders",
                "7d4757d77e57c1db": "withdrawLiquidityFromSellOrdersPair",
                "1760a5215ad66099": "lifinitySwap",
                "2292a02633553a97": "dradexSwap",
                "6c062a0600debead": "claimRewardsV0",
                "efd6aa4e24231e22": "updatePool",
                "60462c8351d05bf7": "createValidation",
                "5945fee84dfa8ea1": "createClassicAuthorityAdapter",
                "3173ff1752095e7e": "serum3EditMarket",
                "75465f8263dff1e3": "tempBackfillOnboardingFeesV0",
                "eca3ccad4790eb76": "mip1ExecuteSaleV2",
                "553c69e5e233256b": "serum3SettleFunds",
                "ef45e5b39cf676bf": "aggregatorOpenRound",
                "05ee98b948780391": "approveProgramV0",
                "437f9bbb64ae6779": "setMintAuthority",
                "9c3a49f12598bf47": "depositReturnedSolToLiquidatingBond",
                "d90a2dd1e1ae3edb": "buyFromTensorswap",
                "22872f5bdc18d435": "updateProtocolIfSharesTransferConfig",
                "db08f660a9795b6e": "updateSerumVault",
                "03246659b48078d5": "repegAmmCurve",
                "eb9d500823423682": "initNftDataV1",
                "93e5fd54fd430db2": "claimVest",
                "30f16452da4eb9ad": "addPoolPartTwo",
                "27cd75cd530945a0": "setTakeProfitShort",
                "92ae69f0099d08c0": "closeSlip",
                "16cd71ee23dd02bd": "earn_vault_create",
                "f876d3a095968725": "disable_pool",
                "7a5112374bbf1c11": "withdraw_pool_owner_fees",
                "f33e869ce66af687": "proposalReject",
                "b05ac4affd71dc14": "create_platform_config",
                "afc627a2674c3379": "kamino_lending_borrow_obligation_liquidity_v2",
                "86e3a4f77800e1ae": "stake_redelegate",
                "e00a5dafaf91eda9": "stake_deactivate",
                "331396fc699d305b": "createClaimProtocolFeeOperator",
                "62f85611b1e11d8a": "close_loop",
                "68b867f258976b14": "update_fee_config",
                "ad834e2696a57b0f": "commission_spl_swap2",
                "b3c9ec9ed46246b6": "lock_liquidity",
                "c0a8eabfbce2e3ff": "create_partner_metadata",
                "030fac72c8008320": "initializeSharesMetadata",
                "cebacb99fd3dce7a": "pause_deposits",
                "63481bdd79718484": "book_product",
                "d67ddb8bf1471925": "addPricesToMarketOutcome",
                "eba0af7a3db102f7": "cremaTokenSwap",
                "1e825b92805091e8": "saberAddDecimalsDeposit",
                "74e9c7cc739fab24": "initPool",
                "a334c8e78c0345ba": "transfer",
                "452a6c605d6170c8": "closeIfBalanceInvalid",
                "799c6d9f9edbd98f": "claimReferralsRewards",
                "452c48ad3e14b192": "updateDecreasePositionRequest",
                "77fba2982e240afb": "getRepaidCollateral",
                "1398c3f5bb904ae3": "lifinityV2Swap",
                "04cd34efdfa711d3": "stakeV0",
                "05d2ce7c2b446895": "setMinimumSignatures",
                "1b38455f49685612": "updateAccountWindowedBreakerV0",
                "e9177b1648825d80": "VERSION",
                "e661b7f82bbe9a1d": "removeMemberAndChangeThreshold",
                "9a1ab49112c987ab": "createTripleFarm",
                "2b04c88460967c30": "oracleWithdraw",
                "22a2740e65895eef": "initLendingMarket",
                "c65f27c529d69d12": "accountCreate",
                "23615be8b368ac9d": "boundHadoMarketToFraktMarket",
                "b5139a1046d074f4": "redeemFbondsAutoreceiveSol",
                "3983787e4ec41368": "unregisterForeignHashflowChain",
                "c572c4f9aa4badcc": "sendUnlock",
                "d033ef977b2bed5c": "exact_out_route",
                "83700a3b203628a4": "updateOracleGuardRails",
                "601f71200ccb079a": "phoenixFulfillmentConfigStatus",
                "1370ec517f3715c4": "updatePartner",
                "4c9080ef79d27b27": "create_target",
                "13a4edfe408bed5d": "submitBid",
                "51a633d59e549d6c": "update_settings",
                "1a526698f04a691a": "removeLiquidityByRange",
                "8739ec45994d0f58": "kamino_lending_repay_obligation_liquidity_v2",
                "540771dcd43fedda": "jupiter_vote_open_partial_unstaking",
                "a1b227bde7e00dbb": "deregister",
                "6d3d28bbe6b087ae": "sell_token",
                "3ec6d6c1d59f6cd2": "claim",
                "250ac34504d558ad": "poolInitialize",
                "c4ac985c3cba40e3": "platform_fee_sol_wrap_unwrap_v2",
                "08ec5931987db151": "claim_trading_fee",
                "84eb24318b42ca45": "createRegistrar",
                "b169c481998988e6": "extendLockDuration",
                "3ec7514e210dec3d": "marginfiGroupConfigure",
                "647f50d0870475c7": "addClassicWhitelistToMarket",
                "dd50b02599bca044": "createTokenMetadata",
                "e31757127dbfd39d": "withdrawLiquidityFromBalancedPair",
                "90098a47ce221063": "updateMaxVoterWeightV0",
                "558754d060b671a0": "pruneFuturesOrders",
                "1ff83ce2d7a837c7": "mercurialExchange",
                "858cea9c925d28f4": "unstakeLiquidity",
                "acb80c0a346940d5": "transferExcessSpreadBalance",
                "895fbb60fa8a1fb6": "requestWithdraw",
                "374224f0fa496724": "ApprovePluginAuthorityV1",
                "b164f4c37e63392b": "prepareSend",
                "5c892d032d3c75e0": "stubOracleClose",
                "10fcfd9f30f22054": "changeProtocolFee",
                "2e1d37c482bc2a00": "tradeXChainAndSend",
                "6816227b56e08246": "expireSeriesOverride",
                "a5678e26d3a60ee2": "settleDexFunds",
                "fae2e76f9ea41b88": "oracleQueueInit",
                "cc8dedb12ed18e72": "redeemFbonds",
                "06345314d87f4066": "tokenLiqWithToken",
                "ca2734d33514fa58": "depositFunds",
                "949032900870cb03": "payback",
                "d175c2d4871ff81d": "deployLegacy",
                "bdc4e1c972ac19a6": "perpPlaceOrder",
                "0fce49853c085659": "updatePerpMarketMaxImbalances",
                "72da733a73e82396": "setStopLossLong",
                "5943e057048664a8": "kaminoUpdateMaxDelegate",
                "b117bb3bf7d7ffa2": "setVault",
                "b4498485c1e83693": "earn_config_set",
                "21e9d0167d48fd1e": "initMainState",
                "782f0045544a10b1": "enable_pool",
                "4941a704908d9320": "createWooracle",
                "867d0d17912d31c4": "update_pool_name",
                "493b2478ed536cc6": "initializeLbPair2",
                "5e837db8b7187de5": "cancel_authority_transfer",
                "2debe1b511da4082": "graduate",
                "6a0b35f2ac81cfa8": "sell_fix_token",
                "0618f534f3ff9419": "createVoter",
                "ab5eeb675240d48c": "lendingAccountDeposit",
                "6b41ee6cb72feccb": "updateMevCommission",
                "71a177da8f428de1": "overrideOptionBarrierPrice",
                "c89d03b603a4a2f0": "createOrderV2",
                "f61b812e0ac4a576": "suspendMarket",
                "7c72a0e745df4c51": "perpEditMarket",
                "a4b460c067e169e8": "solFulfillSell",
                "4db84ad67056f1c7": "openPositionV2",
                "50664639eb58ef08": "addSupply",
                "0a0bb982a2c49e56": "updateMarketEventStartTime",
                "689b9189a4fcfcce": "transferReferralAccount",
                "bc0dc8407ba79511": "slashedFunds",
                "18caec2af6a65a25": "closeSubAccount",
                "32761515b3f81780": "initializeMarketNode",
                "437f9898d3d0fbe2": "liqTokenWithToken",
                "a9c91e7e06cd6644": "depositReserveLiquidity",
                "9edde74129979bac": "aggregatorRemoveJob",
                "74ce1bbfa6130049": "claim_token",
                "42506bba1bf2425f": "updateUserAdvancedLp",
                "bb30791f64b22951": "updateOrderLockUp",
                "248dd0e7e6cc1304": "updateMarketLiquiditiesWithCrossLiquidity",
                "95611e9632cd0cad": "setTakeProfitLong",
                "c4d4a152fa27c966": "openPositionShort",
                "c53efcc6195db183": "liquidateShort",
                "201d8a05de30cad5": "changeForeman",
                "d20956af416e9816": "leverage_vault_closing",
                "ee78dd8a523c64da": "skim",
                "304aadc9bd26dcf4": "migrateOrcaWhirlpoolToGammaV2",
                "b79a05b7694c5712": "unpause_protocol",
                "e70f843384a540aa": "change_swap_fee",
                "f223c68952e1f2b6": "deposit",
                "f92e37391f263d1b": "exec_strategy",
                "799684afac91c584": "update_node_active",
                "3608d0cf2286efa8": "update_order",
                "1383709baadc2239": "withdrawFromAvailable",
                "c989cfaf4f5fdc1b": "openPartialUnstaking",
                "04f423285553cbfa": "serum3CreateOpenOrders",
                "c4bf01e590ac7ae3": "acceptBid",
                "697fd0863d3d71f7": "updatePricingParameters",
                "a1c74552093fcb2a": "closeTrade",
                "3ad8bfa69d238288": "multipleNewPerpOrders",
                "5454b142feb90afb": "removeLiquiditySingleSide",
                "02e7cfc9c0965f8d": "makeImmutable",
                "d37ab97881b63767": "permissionSet",
                "f3a04d990b5c30d1": "initializeEscrow",
                "f49b9aa5eb7f2cbb": "initializeFanoutV0",
                "504acc220cb74242": "settleOrder",
                "c4edf29dc59dccc8": "inscribeLegacyMetadataAsUauth",
                "2f35192f6d7a1616": "depositInsuranceVault",
                "d2bfbc6bbc417a27": "cancelPerpOrders",
                "ca58959051d701af": "closeMarkerV0",
                "6010e2b56b91e0d5": "perpCancelAllOrders",
                "df867e01b71afece": "deleteInstall",
                "adef53f2882b90d9": "setProtocolFee",
                "14e8e6b6802f209c": "configPair",
                "54cc004241b363e3": "putLoanToLiquidationRaffles",
                "e8ff2750b7dd5e79": "executeSaleCnft",
                "e6798f50779f6aaa": "shared_accounts_route_with_token_ledger",
                "20fc7ad3421f2ff1": "updateDiscountMint",
                "6b00802923e5fb12": "liquidateSpot",
                "1ba5a881d38f2ebd": "setLockUpPeriod",
                "9b2be2afe3732158": "advance_delegation_record",
                "bb1224cf4d34192b": "solFiSwap",
                "77c9652d4b7a5903": "initialize_platform",
                "20d768d1f6b13a7c": "initPartnerStablecoinVault",
                "52821ebd4f491d6d": "set_gt_factor",
                "0fd6b5b788c2f512": "update_program_authority",
                "01e676fb2db165bb": "fulfillDlmmFill",
                "16072162a8b722f3": "closeDca",
                "dbd286409b3189ae": "kamino_lending_init_obligation",
                "362c30ccda8d2405": "marinade_claim",
                "64800587a60c788c": "buy_fix_sol",
                "ee9a198fbf1319e0": "rngProvideHashedSeed",
                "54f89e2ec8cdea56": "reset_steward_state",
                "8c55d7b06636684f": "initialize_virtual_pool_with_spl_token",
                "c9ca897c0203f557": "withdrawPartialUnstaking",
                "1101c95d0733fb86": "matchOrders",
                "0222b9bbaae92598": "upgradeContract",
                "d962060c41ac2385": "unpublishMarket",
                "cb5477e28901b417": "forecloseLoan",
                "856e4aaf709ff59f": "initializeOrder",
                "6b4da1fb4681bd9c": "cancelRemainingAccounts",
                "5a67d11c073fa804": "closeOrder",
                "8bbee6f94da0ce04": "cancelAllMarketOrders",
                "4976a7ecd3d59ed6": "updateLazyDistributorV0",
                "d8b6f68e72073a9e": "trackDcBurnV0",
                "e21d6b07d5309295": "updateValidation",
                "d50a1b51839821c3": "vrfPoolInit",
                "de8378a3e6bb5bd1": "issueIotOperationsFundV0",
                "62034e1171cda1e0": "initializeFbond",
                "7471125431b7a575": "withdrawNftFromPair",
                "fd764225be319a66": "setTreeDelegate",
                "e0506dd84d7499e7": "updateTraderAdmin",
                "28c80b44d62db5ac": "sendOrderCancel",
                "e8fdc3f794d449de": "updateFee",
                "ad73a54ee284cdfe": "createVote",
                "01a633aa7f208dce": "resume",
                "f07fcfe44519fd61": "withdrawV0",
                "ba5511f9dbe762fb": "deleteUser",
                "c1d384ac46ab075e": "initializeSerumFulfillmentConfig",
                "10a203c80e665650": "closeMarketQueues",
                "3095dc823d0b09b2": "initializePermissionlessConstantProductPoolWithConfig2",
                "07386cc924143959": "advance",
                "9ae5a3058979af56": "setPoolLiquidityState",
                "904fa41613bd1c63": "genesisOtcOut",
                "7699457eedecebec": "swapStableForTokens",
                "017868d0fcd24f2e": "leverage_vault_eject",
                "2fe062f324f03cbb": "leverage_config_change_indexer",
                "633aaaeea0784a0b": "set_rate",
                "99d0ce463eea62b6": "swap_exact_out_hinted",
                "c5c4810540b881f2": "migrateOrcaWhirlpoolToGamma",
                "664594e004948e60": "registerDepositLimit",
                "41badb832c423dd8": "add_record",
                "250903c584e0a515": "setPoolAdmin",
                "759f52c5cf55ed2d": "updateWithSigner",
                "626b304f613c633a": "drift_cancel_orders",
                "c85f8c84be4111a1": "kamino_lending_init_user_metadata",
                "d2103405f7a43b12": "token_transfer",
                "d25c565d7b117559": "stake_pool_withdraw_sol_with_slippage",
                "4cfa97c2e2c7f0e5": "app_initialize",
                "0919f9bd8200fa9f": "set_fee_multiplier",
                "f24c1e8a31faca2a": "platform_fee_spl_proxy_swap",
                "0f981c70b7e7e38d": "collect_fees_lp",
                "2d1881260e41070f": "onboardIotHotspotV0",
                "9935333bde663483": "takeLoan",
                "2f031b61d7ecdb90": "exchange",
                "494c87d82b07cafd": "transferAndFreezeCollateral",
                "54e61a4b02b3afea": "updateSecondaryAdmin",
                "48d62c2035de09f4": "answer",
                "0bbcc1d68d5b95b8": "initializeTickArray",
                "99d92214131de54b": "set_clawback_receiver",
                "f0ddfe4045ba8723": "sendFundsToMarketMakers",
                "0aeec2e84c374404": "managerRequestWithdraw",
                "a9dd17f8db7a8e9e": "updateZetaPricingPubkeys",
                "a59ee561a8dcbbe1": "deactivateStake",
                "4b5d5ddc2296dac4": "withdrawObligationCollateralAndRedeemReserveCollateral",
                "fabf388096fb0167": "clean",
                "8eb5bf9552afd864": "withdrawNft",
                "64196302d9ef7cad": "deletePositionBundle",
                "8fe58330f8d4a7b9": "removeCustody",
                "9b7bd602dda6cc55": "updateStateMaxNumberOfSubAccounts",
                "7cc2f0fec6d5347a": "resolveSpotBankruptcy",
                "417a40a4e62f31e6": "updateNewDataV1",
                "58ef6c258dc097d6": "addPoolPartOne",
                "6e4f4d0a1eb51201": "changeBeneficiary",
                "57f5204eb69da3f9": "add_pool_operator",
                "058cebb63e276d3e": "create_super_account",
                "ac2cb398157feab4": "batchExecuteTransaction",
                "0a1a1db0a365509e": "createWooAmmPool",
                "faafc0cca1866989": "setWooBound",
                "eb5db5c281db77f3": "setWooSpread",
                "faea0d7bd59c13ec": "buy_exact_in",
                "2133a3c975627de7": "addLiquidityOneSidePrecise2",
                "a7a4c39bdb98bfe6": "system_transfer",
                "cd0bd118cc2f19ba": "gambaSetConfig",
                "e33e02fcf70aabb9": "lock_position",
                "94ce2ac3f7316708": "withdrawIneligibleReward",
                "d15c57b9131d705b": "set_trade_fee",
                "6454de5a6ad13ade": "fill_relay",
                "16f7d6bf5a4a57d8": "initialize_claim_account",
                "76ad299dad486167": "initializePermissionlessPool",
                "f09ac9c6945d3819": "setRewardAuthorityBySuperAuthority",
                "809bde3cba28e132": "cancelAllAndPlaceOrders",
                "d59f98419956b864": "unpauseSrcContractAddress",
                "eabacc1c5b58f6f4": "setEntityActiveV0",
                "54687b27915cd1db": "newSpotOrder",
                "f66c1be5dc2ab02b": "cancelBidReceipt",
                "afbb034908fb43b2": "setGovernanceParams",
                "068724e82327fa47": "initializeZetaGroup",
                "c3510aedef8e8d71": "setBondCollateralOrSolReceiver",
                "976801653a9f691f": "initializeDaoV0",
                "cf0fc64ac5e4b01e": "closeOpenOrdersV3",
                "ed1aaa75e6aa1932": "setAdminFeeAccount",
                "759ea6bce665868e": "BurnCollectionV1",
                "cf755fbfe5b4e20f": "collectFeesV2",
                "25adac211c7f0d45": "addGenesisLiquidity",
                "f12230ba25b37bc0": "mintTo",
                "edec9dc9fd14f843": "closeGame",
                "dd019aca04695bbd": "leverage_vault_set_safety_mode",
                "acc92941fcc4fde4": "buyExactTokensFromQuote",
                "8de94b66255d5e4f": "make_initial_deposit",
                "1fe622902bde4758": "set_referral_reward",
                "8fcd03bfa2d7f531": "initiateFlashFill",
                "4573eb4ad09b6c3e": "switch_mode",
                "fbbdbef475fe2394": "initializePositionByOperator",
                "2905eeaf64e106cd": "addLiquidityByStrategyOneSide",
                "eecec6d733b285e4": "reject_owner",
                "38f7aaf659dd86c8": "close_strategy",
                "a0c2f008d45d9ddd": "execute_timelock",
                "0de2a39038cad617": "migrate_tda_merkle_root_upload_authority",
                "14c6caedebf3b742": "withdraw_leftover",
                "2db903246dbe73a9": "updateVoterWeightRecord",
                "91bd4499a1e74c6b": "grant",
                "136f6b81df936c41": "calculationAgent",
                "9118f905bc42d326": "publishMarket",
                "62b37f333abfaebc": "onboardDataOnlyIotHotspotV0",
                "466172e2219650d9": "issueProgramEntityV0",
                "effafaf498e3b416": "wormholeReceiveXChainNative",
                "0dc556a86db01bf4": "setRewardEmissions",
                "73eb2601733ada51": "audit",
                "f0b014d4b5891cf3": "transferToProgramUnderlyingTokenAccount",
                "dc11551470ae94e3": "initializeOpenOrdersV2",
                "7a280e40a912e788": "addPerpMarketIndex",
                "bf99dba405419930": "collectPlatformFees",
                "737f0dbc56980b10": "createMarketType",
                "f14c5ceae6f0a400": "vrfInit",
                "cf05c8d17a3852b7": "setRewardEmissionsSuperAuthority",
                "f5e5df780786f7f8": "initializeZetaReferralsRewardsWallet",
                "c79b6dda3ec427c1": "updatePriceBasedLiquidityPool",
                "fe7a5d2b1bd50058": "depositToMeteora",
                "3863d54a2f4810ca": "updateSplit",
                "5ef95ae6ef4044da": "printBidReceipt",
                "838d21018d30fc30": "updateTimeBasedLiquidityPool",
                "2c452be2ccdfca34": "updateInsuranceFundUnstakingPeriod",
                "fc8d6e651b63b615": "updatePerpMarketFuel",
                "dc841b1be9dc3ddb": "updatePrelaunchOracle",
                "0d46a829fa64945a": "createMintMetadata",
                "fd08a19340153c91": "editUserProfile",
                "fa547a59fdb939ba": "genesisOtcIn",
                "93166cb26e12ab22": "perpsSwap",
                "7dce366d06eab853": "leverage_vault_take_profit",
                "506c3be83b44cf3e": "resolveUnstakingTicket",
                "12a6ef9d7af2fe98": "set_admin_rnr",
                "83dc6ae083d2f321": "collect_protocol_income",
                "d8d57e329cc21253": "create_tld",
                "1555da7ab6bd52c8": "stake_move_lamports",
                "3d7334172e0d1f90": "togglePairStatus",
                "e5b4ab83ab063cbf": "cancel_by_resolver",
                "a859631e753158e0": "deposit_into_raydium",
                "925bfd2be484ca70": "fee_withdraw_sponsor_set",
                "575ac13cf6773e58": "remove_resolver",
                "d5e162f5090f9a3f": "admin_mark_for_removal",
                "4eddb9fff080f4a2": "updateMaxVoteWeight",
                "d8b68f0bdc2656b9": "newEscrow",
                "70eb36a5b251190a": "applyProfitShare",
                "eb84d7e1d52b2b26": "updateProgramVersion",
                "7f7ec7755a591d32": "getLiquidationState",
                "f939bb66b86825e7": "initializeZetaTreasuryWallet",
                "28151b181ef06932": "stopLiquidationRafflesByAdmin",
                "72d53b2fd69d96aa": "addMemberAndChangeThreshold",
                "6b490f77c3745bd2": "setDataSources",
                "f1935e0f3a6cb344": "marcoPoloSwap",
                "07160c53f22b3079": "transferRewardOwner",
                "fa7135368d75d7b9": "addValidator",
                "87802f4d0f98f031": "openPosition",
                "e3c135ef377e7069": "createTransaction",
                "cc0d3d9961539262": "resetDelegate",
                "7fdf57e464d78fb1": "initializeTestOnlyAccounts",
                "7ee015ffe4357521": "depositVault",
                "486bc849453fd916": "calculateVaultPayoff",
                "b55b9a2b85ef869d": "extractCollateralToLiquidate",
                "89b2313a00f5f2be": "setFees",
                "2f7f5add0aa0b775": "reclaimStakeAccount",
                "3c429028d0b2976b": "getOutstandingAmount",
                "2a885acf00b1bd76": "publicBuyCnft",
                "1752e1dedb7ae6fb": "applyPerpFunding",
                "79763bdc568da67a": "benchmark",
                "d2a4a1d34780dff4": "mintV0",
                "bb69d389e03b1de3": "attachPoolToMargin",
                "c852a0203b503289": "vrfLiteCloseAction",
                "9b39981b9a8ca67e": "setPoolParams",
                "370935097239d134": "initializeConfigExtension",
                "a9717eabd5acd431": "openBundledPosition",
                "e24a05596cdf2e8d": "updatePerpMarketMinOrderSize",
                "c25cccdff6bc1fcb": "updateUserMarginTradingEnabled",
                "141493df293fcc6f": "transferDeposit",
                "53a0fcfa817431df": "updateExchangeStatus",
                "2ae50ae7bd3ec1ae": "migrateFunds",
                "482dd00eaeee1b5f": "updateEscrowV1",
                "aa970758c256f570": "revokeProgramLockPrivilege",
                "7663eef308a7fba8": "stubIdlBuild",
                "c5eb2f01e40ac8b8": "addCollateralShort",
                "bfcc32195815912b": "openOrIncreasePositionWithSwapLong",
                "a3d014acdf41ffe4": "takeOrder",
                "7e35b00f276761f3": "flashTakeOrderStart",
                "44d1b1aab9641dbf": "swap_exact_in_quote",
                "65a0f93f9ad7990d": "programConfigSetMultisigCreationFee",
                "04949164861ab53d": "closePresetParameter",
                "0bc5ea39a44ab5ef": "jupiter_vote_cast_vote",
                "fd12e062e22b414c": "price_tickets",
                "a99004260a8dbcff": "unpause",
                "1a6da44fcf91ccd9": "poolDeposit",
                "14a1f118bdddb402": "initialize_customizable_pool",
                "91cb6b7b473f23e1": "decrease_validator_stake",
                "456f7c45451d60b5": "reset_validator_lamport_balances",
                "7b45a8c3b7d5c7d6": "emergencyUnstake",
                "60ab066299b7e91f": "setOracleConfig",
                "23d1b41df5c77d10": "initializeZetaPricing",
                "387165fd4f377aa9": "verifyCollection",
                "96d480ba74018371": "initializeEscrow2",
                "4a35d3ae26a8e3b1": "createProvider",
                "e11b0d064554acbf": "updateFees",
                "71cdf4fa6c97da41": "owner",
                "c1129b3ea17c5019": "createMarketV2",
                "0ad6db8bcd16fb15": "withdrawRewards",
                "ea8f3de6d43908ea": "vrfPoolAdd",
                "09f15e5bad4aa677": "updateTreasuryFeeVault",
                "8e27acbd3aa0ca66": "getInstancesForAgentId",
                "407c0639979b1ac3": "takeFlashLoan",
                "e8c27a44a7f677c5": "issueEntityV0",
                "189c087941030552": "halt",
                "997ab197f056f0d5": "crankPopV2",
                "a2c676ebd7f71976": "initialise",
                "fdaaa4549b70012e": "bufferRelayerSaveResult",
                "05a7a1a09e65e48b": "setPoolNodeStatus",
                "7e7adb46bc7ef37e": "updateBeneficiary",
                "efbc194ef0dfe531": "initializeStructuredProduct",
                "d5deb6f5de6b3e47": "viewVersion",
                "76d7d69db6e5d0e4": "setDefaultFeeRate",
                "c7d1c1d58a1eaf0d": "programInit",
                "219c4adad72a70af": "settlePosition",
                "fc212530c32781e4": "setNewTipDistributionAuthority",
                "8bcd8d8d71245ebb": "updateUserDelegate",
                "6d2157c3ff240651": "updateSpotMarketMarginWeights",
                "2f973b0c79aff8fa": "resolveStakingRound",
                "324223d6da1f9844": "closePositionLong",
                "2f3e9bac83cd25c9": "wrap_sol",
                "b248df36ebc40119": "registerPair",
                "e1dd2dd3313c33a3": "withdraw_lp",
                "3123654c5d041f35": "deploy_liquidity",
                "f349817e3313f16b": "initializeCustomizablePermissionlessLbPair2",
                "8770d74bf7b935b0": "update_state",
                "dc90810488fb55ea": "set_subscription_paused",
                "7512d206eeae87a7": "drift_place_orders",
                "ea66c2cb96483ee5": "extend_account",
                "30d7c59960cbb485": "createPosition",
                "61ce27695e5e7e94": "claim_partner_fee",
                "8c88d630570078ff": "init_global_config",
                "b0ce7ef832d7272c": "fill_order_by_resolver",
                "194799b7c5c5bb03": "resume_steward",
                "a3d831cc611050a7": "create_token_accounts",
                "0e8321dc51bab46b": "lendingAccountStartFlashloan",
                "997209336444f0c5": "createOrderBook",
                "7f467728bce33d07": "updateOperationAccount",
                "aa4fca7b5165a858": "RemovePluginV1",
                "db8649dbb4075ece": "closeOrderBook",
                "8b2f793b74e37963": "setIxMaintenance",
                "97260eee91653087": "wormholeSendXChainTrade",
                "69d729efa6cf0167": "closeMarginAccount",
                "786faf77c4d879c0": "updatePriceOracleV0",
                "0f432dc3d789e52f": "work",
                "46a47610a9894228": "updatePriceV0",
                "5c0ef1983a5cbc39": "changeFeeReceiver",
                "bee4fd10c994a1f0": "closeSpreadAccount",
                "404099ffd947f985": "createOpenOrdersIndexer",
                "8c55f98c72a06ff7": "depositSolToFlashLoanPool",
                "aa50f8b0aa8e1195": "UpdateCollectionV1",
                "6f880042c678568c": "unsetBondCollateralOrSolReceiver",
                "9dd258a48ab51bfa": "delistCollateral",
                "1e406323709f29b1": "initializeAccountWindowedBreakerV0",
                "0a3644fc82612734": "initMarginAccount",
                "9eef70b9141996cb": "setCrankAuthority",
                "969e5572db4bd45b": "createFeeTier",
                "392386a214d637e3": "cleanMarketNodes",
                "b16b25b4a01331d1": "collectRewardV2",
                "2924d8f51b556743": "closeBundledPosition",
                "3a0ed9f8722cd48c": "getPositionData",
                "643d9951b40c06f8": "updateSpotMarketPausedOperations",
                "8719b938a5352288": "updateUserName",
                "ae6de401f269e869": "beginSwap",
                "15a7251307ae8818": "initLockups",
                "ecabda916109ad48": "kaminoUpdateDelegateAuthority",
                "62eff4e910ec2831": "swap_exact_in_hinted",
                "1ce22094bc8871ab": "createProgramOpenOrders",
                "f3bcb3b0d953ae41": "set_lp_config",
                "97e1888edded69b7": "close_credit",
                "c7cbfbb584b46782": "set_buyback_factor",
                "8fd61d4aa9e264fd": "buy_super",
                "16ecafdb96cd80e4": "setSuperchargerVaultWhitelist",
                "a5c73ed651360496": "add_operators",
                "412d774dccb25402": "create_raydium_pool",
                "3e21805128ea1d4d": "withdrawFromPool",
                "2f2925e2c2873793": "us_platform_fee_sol_wrap_unwrap",
                "a165045d783e2914": "compute_score",
                "1437613bfba77520": "unfreeze_nft",
                "b2722eb0eed9a72c": "completeMarketSettlement",
                "7a24ffb1c0f378f3": "agentUpdate",
                "cab8e4033ba35d5a": "buyCnft",
                "77ef122dc26b1fee": "repayFlashLoan",
                "1a34873c36d42be0": "buyFromHadeswap",
                "3fd5366d6db689bf": "ocpWithdrawSell",
                "3595f92ec851cf0e": "swapWhirlpool",
                "02a0e7ad373576a2": "withdrawLiquidityOrderVirtualFees",
                "27a20c5363885d7e": "mapOperatorAndServiceIdOperatorBalances",
                "0f5167b7d014e783": "createBondWithSingleCollateral",
                "c98d922ead74c616": "withdrawDirectlyFromStrategy",
                "ba315c345e830567": "withdrawFromMeteora",
                "c0446aee3b3b9c41": "setVaultPauseStatus",
                "e8b6b689565876fc": "closeCrossMarginAccountManager",
                "e86f73c4ed8f3ecc": "placeOrderV2",
                "ade7d9e2b2f79057": "setTimeOffsetV0",
                "85f38aa79ad7fba7": "unpauseState",
                "fb35ada33c96a3b5": "modifyAsset",
                "80cf8e0b36e826c9": "refill",
                "3b0b496b286940d2": "solMip1FulfillSell",
                "c71c75e0ac8ce771": "setPoolNodeAuthority",
                "bb4ae5956651dd44": "liquidatePosition",
                "afe1624776422294": "sweepFees",
                "8d997b3167a05275": "withdrawLiquidityFromBuyOrdersPair",
                "dbed6ededbef46ed": "deleteConfig",
                "5c40858a103ef5fb": "oracleTeeHeartbeat",
                "e1e69d7fd4ff3d35": "issueHstKickoffV0",
                "c18b62ba78747965": "pdaSeed",
                "5bf64546bc3b1391": "takeSnapshotCreateEntry",
                "8c54f3f91d94121d": "perpDeactivatePosition",
                "d0f48d6c553e12f1": "stakeDelegationsProcessDelegation",
                "6bd3fa8512253964": "cancelOrderByUserId",
                "65d74f4a3b294f0c": "updateSpotMarketIfPausedOperations",
                "94b6037e9d72dc63": "updateSpotMarketFeeAdjustment",
                "3534ff2cbf4aabe1": "createSellOrder",
                "56e8b5899e6e81ee": "update_agreement_hash",
                "da324dba274ea6a3": "unstakeDvypass",
                "07185a20bfba6103": "leverage_config_change_keeper",
                "63280e692d6bacc9": "unwrap_sol",
                "4b56da28db068d1d": "add_minter",
                "7292f4bdfc8c2428": "configTransactionExecute",
                "0b225cf89a1b336a": "proposalActivate",
                "a53dc9f4829f1664": "setPreActivationDuration",
                "082957235030791a": "closeClaimProtocolFeeOperator",
                "3b8418f67a2708f3": "mint_tokens",
                "c70da8145c971d38": "stake_withdraw",
                "1dedf7d0c1523687": "create_vault",
                "534ee67be2289e61": "unstake_user_vault_lp",
                "1d9efcbf0a53db63": "updateConfig",
                "5364863c8d9b92c7": "create_collateral",
                "ecbe5722fb838aed": "closeDepositEntry",
                "b1c878866ed99351": "giveUpPendingFees",
                "a0a25a3620c95aec": "configPriceHistory",
                "d33906a70fdb23fb": "mintNft",
                "87421867fa32870a": "configSuspendAdmin",
                "ec4da211c043e0d9": "aggregatorSetConfig",
                "820c50e724884542": "closePoolNode",
                "11fad52dac7551e1": "withdrawInsuranceVault",
                "221eb65195c63eb5": "setPoolAuthority",
                "dd0ba72f506b1247": "vrfLiteRequestRandomness",
                "5bdc31dfcc8135c1": "executeSaleV2",
                "2064a105a00acc39": "migrateV2Loan",
                "f1be6b1af4ec77e5": "initializeReferralAccountWithName",
                "93351992141d235a": "verifySignatures",
                "0bf3e9f7574f60c6": "accountToggleFreeze",
                "69abdf446b3e0cf3": "liqTokenBankruptcy",
                "c03c99a2f6c83257": "perpPlaceOrderPegged",
                "f4b6772c67c28975": "proposeLoan",
                "8ad4894a9873ae7f": "setTriggerPrice",
                "eee15f9ee36708c2": "cancelOrders",
                "c24f95e0f666ba8c": "updatePerpMarketMaxOpenInterest",
                "e010b0d6a2d5b7de": "resolvePerpBankruptcy",
                "3966ccd4fd5f0dc7": "updateSpotMarketMaxTokenBorrows",
                "ed4bc6ebe9ba4b23": "liquidatePerpPnlForDeposit",
                "1ebde5db7b773e98": "onboardDataOnlyMobileHotspotV0",
                "43835dec3806284d": "createSwapReferral",
                "35a20b6d3939baf8": "migrateRaydiumClmmToGamma",
                "7a4d509f54585ac5": "multisigCreate",
                "5fc8472208090ba6": "sell_exact_out",
                "b54cdb4b10e8d4d5": "setMaxSwappedAmount",
                "d8ac82942262d7a3": "swap_tokens_for_sol_on_raydium",
                "66063d1201daebea": "buy",
                "955248c5fdfc440f": "initialize_pool_with_dynamic_config",
                "8e94463974a6526f": "transfer_protocol_fees",
                "057932f30e9f6106": "increase_validator_stake",
                "2fb8d5c123d25704": "raydiumClmmSwap",
                "785a390824ff5219": "initializeRegistrarV0",
                "254ad99d4f312306": "executeSale",
                "1176a4f2c899957d": "CreateV1",
                "ac3f65538d4cc7d8": "stubOracleCreate",
                "602b842aaf26568d": "submitPriceV0",
                "d5283a63816df593": "solOcpFulfillSell",
                "7167c84acce8d9d9": "distributeRewardsProcessFrame",
                "8888fcddc2427e59": "collectProtocolFee",
                "611d7bc7e414b8fc": "serum3PlaceOrder",
                "a66403eb86c595aa": "settleFuturesFunds",
                "6e77c22997e019a7": "updateVoterWeightRecordV0",
                "c99b5ec4825e8cac": "updateProductFees",
                "1faa5f5d583609e7": "serum3LiqForceCancelOrders",
                "b4c2b63f307d7488": "setCustomOraclePrice",
                "95750bed2f5f59ed": "placeAndMakePerpOrder",
                "869be985fabb743a": "leverage_vault_set_emergency_eject",
                "266711eb8d628ed4": "leverage_vault_fund",
                "c8e35a531b4fbf58": "setActivationSlot",
                "09be433e2efb90ba": "stake_move_stake",
                "7284c2d1d0952b88": "stake_user_vault_lp",
                "bac352bbc4c7879e": "update_market_information",
                "5ded902527a698f2": "commission_fill_order",
                "c5add5c8cee91079": "register_lottery_results",
                "cbbd4847894c7af4": "update_nft_metadata",
                "ce6178ac71cca946": "lendingPoolSetupEmissions",
                "41bf137fe61ad68e": "cancelTransaction",
                "5cbdb0f581ada6a9": "closeCanopyV0",
                "a81081541c028b42": "transferToEscrowAccount",
                "3613ceb5eac50f4a": "cancelPreplayOrderPostEventStart",
                "b3fb505f6155cf52": "initEscrowPda",
                "4d1d5558e0b59d45": "aggregatorClose",
                "ff73dc3a1a9d70b9": "takeLoanV3",
                "1c4edeebd144b653": "updateAllowlists",
                "407b7fe3c0eac614": "addStrategy",
                "431c034e8c6c148a": "initializeReferrerAlias",
                "85fa25156ea31a79": "set_authority",
                "4fb38a6e4366a964": "unsuspendMarket",
                "e1cf451ba1abdf68": "jobSetData",
                "898c5e12e7e8d9cc": "cleanZetaMarketHalted",
                "382d230dfdfe3a50": "tokenRegisterTrustless",
                "d99194fab7c77fd4": "closeOracleProducts",
                "5a5f6b2acd7c32e1": "unstake",
                "2869d9bcdc2d6d6e": "closePositionRequest",
                "d6238f4461f865f1": "forceWithdrawRewards",
                "f6aee4f91cd14555": "copyGossipContactInfo",
                "a6782c8f053f79d2": "revokeProgramV0",
                "63880f4255921859": "depositToPool",
                "f4c802fafe7b4e5d": "setFeeShare",
                "e7ff6119928bae04": "updatePerpMarketStepSizeAndTickSize",
                "6f11b9fa3c7a26fe": "initializeUser",
                "926ad024bbf17a02": "lockPermissionless",
                "fcbaa10cc493b483": "initTwoLmTokenMetadata",
                "f24a741d6a94f1cd": "removeCollateralShort",
                "7322f77b41796974": "getPoolInfoSnapshot",
                "8a558fae2f4d332b": "leverage_vault_keeper_repay_borrow",
                "190272030e083fbe": "leverage_config_set",
                "0a110547ccab7ead": "set_numeraire_status",
                "00738d447ad82435": "change_huma_owner",
                "c21a081e2612f508": "buyTokensFromExactQuote",
                "0ef53ba9277efa4e": "updateEndoavs",
                "6c66d555fb033515": "initializePermissionLbPair",
                "a68376db8adace8c": "create_loan",
                "78381b0735b071ba": "distributeFees",
                "a5e4853063f9ff21": "claim_protocol_fee",
                "60430c9781a41247": "commission_spl_proxy_swap",
                "acabd4ba5a0ab518": "close_steward_accounts",
                "a50389071c864c50": "creator_withdraw_surplus",
                "59ee59a0ef71197b": "setTimeOffset",
                "355801903a41b63c": "tradingOpenBorrow",
                "d3ebcd1d6d569927": "updateIotInfoV0",
                "7bcb9881a28c8353": "closeOrdersAccount",
                "68b614bb03a43c03": "updateZetaState",
                "51f33c5adec929de": "forceCancelOrderByOrderIdV2",
                "26f1156b783bb8f9": "cykuraSwap",
                "ff59bc1f91369d7a": "authoriseAdminOperator",
                "1960d39ba10ea8bc": "removeValidator",
                "19b2ce1728d4395f": "genesisIssueHotspotV0",
                "f9cf1385b081f9d7": "consumePerpEvents",
                "d5d4679008d4ade8": "updateStakeHistory",
                "67ff50ea5e38a8d0": "updateAuctioneer",
                "6a29223011b13bff": "forceWithdraw",
                "8781fc448d4af618": "setFuturesMarketLiquidityMiningInfo",
                "301228284b4a936e": "executeInstruction",
                "2c4ce0d5e0819e12": "setCacheAuthority",
                "92153379bbd00745": "createDecreasePositionRequest",
                "febd827de5b1e958": "SOLANA_RENT_LAMPORTS",
                "6db34d38c2272b27": "updateVaultEpochTimes",
                "0aab4570401398f5": "overrideVaultStatus",
                "d21a02e83b25c468": "takeSnapshotCreateSnapshot",
                "392cc03053086b30": "sellNftTokenPool",
                "d63264d12622074c": "postMessage",
                "737fc4dbebc660fd": "setCurator",
                "fa1388d0e55e88da": "issueHstPoolV0",
                "fa7a4d3065fef3a8": "updateMintWindowedBreakerV0",
                "5237cacb9ec6f067": "initializeLazyDistributorV0",
                "72e44820c130a066": "setRewardEmissionsV2",
                "49ae7741950549ef": "getLiquidationPrice",
                "61d8698371f68e8d": "updateSpotFeeStructure",
                "11d00101a2d3bce0": "updateSpotMarketName",
                "27a68bf39ea59be1": "updateSpotMarketCumulativeInterest",
                "ec800f5fcbd64475": "updatePerpMarketContractTier",
                "38d138c577febc75": "addPerpLpShares",
                "5c28972a7afe8bf6": "depositIntoSpotMarketRevenuePool",
                "2b3dea2d0f5f9899": "settlePnl",
                "01ab1887c9ecd2db": "swapSolForTokens",
                "8a8d1cc107d3b545": "lockWithWhitelist",
                "c5b849f61889b8d0": "update_delegation_fee",
                "fe5f9cb16a8d973d": "addLockedStake",
                "6a39375ea0f38d27": "closeDepositPosition",
                "60c44a663dc330b8": "initialize_airdrop",
                "c5692e02fd08c524": "solayerDelegateUndelegateNoInit",
                "b0cfee3cc302cb5b": "create_swap",
                "8e772b6da2340bb1": "openDcaV2",
                "df5ed760afb5c3cc": "meteora_dlmm_initialize_position",
                "93bb5b979ebbf74f": "stake_pool_deposit_sol",
                "4ba8dfa110c3032f": "updateBaseFeeParameters",
                "83160467185ea3ef": "init_registry",
                "eb9b2d94bbc61db3": "fee_withdraw",
                "bcdced1fb512552d": "playerClaim",
                "a75a899a4b2f1154": "create_locker",
                "2d61bb67fe6d7c86": "create_virtual_pool_metadata",
                "1b889ff07f447ba4": "execute_relayer_refund_leaf",
                "5e0d0a10aac4e62a": "release_tokens",
                "23087952da4efca2": "closeNftList",
                "5ccbdf285c593577": "cancelOffer",
                "84e64e32488fb79e": "resetSubDaoThreadV0",
                "b763758bc6788cda": "setMarketReadyToClose",
                "25b259925bf1ec61": "raydiumClmmSwapExactOutput",
                "423ddc3badfd91f1": "transferNativeWithPayload",
                "9ccb36b326482115": "cancelEscrow",
                "fb0ae74c1b0b9f60": "initObligation",
                "8b73b3a8f9f3f0b8": "claimListedNft",
                "5c1900f3e6cdfe43": "initializeReferralAccount",
                "9399c589a1bdc207": "issueRewardsKickoffV0",
                "f326c64cac407f18": "createNftList",
                "02054dadc500079d": "mercurialSwap",
                "189c17fd2e4cf7ca": "withdrawFixFee",
                "ceec3a3aabdded39": "initIndex",
                "45ed572bee7d2801": "createReview",
                "490437f6259b02a6": "ocpCancelSell",
                "bdf4470e16c6205c": "liquidateReceivingNftFbondPnft",
                "3847fc694e7a6f0c": "deleteReferral",
                "17643df186be3035": "processWithdrawQueue",
                "7e048de860d74a98": "initializeWormhole",
                "1db40915e182948f": "setOracleStubPrice",
                "a05c7dbb20b37258": "reimburse",
                "56de82565c144841": "removeCollateral",
                "c96ad9fd04afe461": "updateAmms",
                "84e0f3a09a5261d7": "updateLiquidationMarginBufferRatio",
                "17f321586e54c425": "setRelayer",
                "7500fc39416f2f26": "createBot",
                "75c993774723fdda": "approve_receivable",
                "1c6fde087e532c45": "create_lender_accounts",
                "b1b9b95e50fd89ff": "set_fee_structure",
                "335083e15a5651f8": "add_liquidity_asset",
                "1b89a665f918b54b": "treasury_settings",
                "ecf63e853cc37697": "enter_pre_closure",
                "cab8678fb4bf74d9": "updatePositionOperator",
                "5de27a788223bdd0": "jupiter_vote_merge_partial_unstaking",
                "8de63a6738cd9f8a": "marinade_deposit_stake_account",
                "ff579ddb3db2909f": "jupiter_vote_new_escrow",
                "95fb9dd441b5eb81": "close_mint",
                "7387a86a8bd68a96": "withdraw_collateral",
                "2a145953de25046d": "remove_operators",
                "387ab21ec702f316": "check_client",
                "cfe10e885bfb95ab": "sell_fix_sol",
                "aba214a8f8fcd06e": "add_fund",
                "22b743bf6eacf4ea": "vest_tokens",
                "58bcba41bd6b6f79": "tokenByIndex",
                "ea75b57db98edc1d": "redeemReserveCollateral",
                "45857c99588eea42": "createOrdersAccount",
                "55e3ca462dd70ac1": "takeBidMetaHash",
                "93d46ac31eaad180": "setTokenStandard",
                "73b2c908afb77b77": "cancelOrderByClientOrderId",
                "e4bfce0cf25a8922": "saberAddDecimalsWithdraw",
                "f2c2cbe1ea350a60": "takeBidFullMeta",
                "9e9a632975c418ed": "paybackWithGrace",
                "c8d17a20f9504558": "sellEggs",
                "0e7ae7da1feedf96": "withdrawFee",
                "db52dbec3c73c540": "setMarketExpired",
                "f56255b3e6d78239": "perpSettlePnl",
                "81c70402de271a2e": "depositReserveLiquidityAndObligationCollateral",
                "c411218cae82210c": "reallocValidatorHistoryAccount",
                "f422e58c5b41c843": "updateMarginTradingEnabled",
                "ee8ad4a02e353358": "createProposalMeta",
                "ba1ac786dcb12048": "withdrawMarginAccountCpi",
                "a5552ef9643df970": "ownerOf",
                "543c360d302aee05": "migrateToHashlist",
                "f22ab84d859876cc": "buyNow",
                "e60a208454720eff": "updateTradingAccount",
                "f846c6e0e0697dc3": "initializePredictionMarket",
                "1a63105476639c15": "processOrderMatchTaker",
                "3657a51345e3dae0": "createLockEscrow",
                "35d489ed4ed996cb": "finalizeGenesisLockCampaign",
                "9767806b707343ac": "upgradeLockedStake",
                "323927845630cc2d": "initiateBatchWithdraw",
                "b26cd0899ac2a8d5": "goosefxV2Swap",
                "c1209b3341d69c81": "sharedAccountsRoute",
                "6be424c8a2b2baa2": "initializeGlobalAccounts",
                "a621d1e40f2efc43": "migrateMeteoraDlmmToGamma",
                "8a7fad74b877a091": "migrateRaydiumClmmToGammaV2",
                "331d72389561eba2": "takeOrders",
                "a82621a875468747": "mock_distribute_profit_to_tranches",
                "09fe350d5efa9407": "make_payment_on_behalf_of",
                "d35a24fb5bb9d823": "process_redemption_request",
                "cfe0aa8fbd9f2e96": "setLockReleaseSlot",
                "c3acb8c317b291bf": "jupiter_vote_withdraw",
                "ad3ecc71ce1b9380": "manage_collateral_increase_orca_liquidity",
                "bd26cdea514d1901": "collect_trading_fees",
                "4d4f559621d9346a": "initVault",
                "2eecf1f3fb6c9c0c": "setVoteDelegate",
                "fba92ac368e9c44a": "RevokePluginAuthorityV1",
                "7f44d306084d21f2": "createPriceLadder",
                "a349682ebe47805c": "getLotTicket",
                "8db9fb3f4a55d291": "placeOrderPegged",
                "bd8d23815639cddb": "updateSecondsPerLiquidity",
                "c420da7697e92b38": "getExactOutSwapAmountAndFees",
                "f3af2e7c5f652745": "voidMarket",
                "0882ba15e7a5600b": "liquidateFbond",
                "6cd8263a6d927411": "recover",
                "8e2d09ba27567ce3": "registerWormholeForeignEmitter",
                "5d2f2dc33efc2022": "perpCreateMarket",
                "c78fad93cacc40cc": "initializeMarketTifEpochCycle",
                "f900c623b77b39bc": "updateFeeRecipient",
                "a8e3323ebdab54b0": "addBalanceLiquidity",
                "2c0d9c04eb26b7e9": "sendBatchUnlock",
                "48988c9ec35df71f": "updateZetaGroupPerpParameters",
                "a200d737e10fb900": "refreshAssetsUnderManagement",
                "aeae8ec12f4deb41": "addKaminoRewards",
                "2574cd67f3c05cc6": "withdrawObligationCollateral",
                "116a852ee5302dd0": "auctioneerBuy",
                "b174c9e910020bb3": "permissionInit",
                "0a18a8775630e111": "configLp",
                "d355b841b7b1e9d9": "withdrawStakeAccount",
                "8f76857eb93794d6": "getLotTicketByStaking",
                "6ba7facfb714abcb": "calculateUtilityScoreV0",
                "4862098b81e5ac38": "updateK",
                "6144c7eb83503dad": "updateStateSettlementDuration",
                "5d800b771a14b532": "updateSpotMarketMinOrderSize",
                "d7e4964246392b2d": "tempStandardizeEntity",
                "106762636a240569": "perpsV2RemoveLiquidity",
                "0dea6f5383700c15": "leverage_vault_keeper_release",
                "a48b8fb98e4504e4": "leverage_vault_create",
                "01b6873b9b1963df": "closePositionWithTokenExtensions",
                "b99c4bdb6b3323d1": "closeBot",
                "48096815d7482390": "approve_credit",
                "28494b8a2d608742": "make_principal_payment",
                "537da645f7fc6785": "endAndClose",
                "43f8e7899a95d9ae": "setPairStatus",
                "3b7cd4765b986e9d": "closePositionIfEmpty",
                "f8c69e91e17587c8": "swap",
                "385138555c31ff46": "unsetAccountFlag",
                "7be5b83f0c005c91": "whirlpoolSwap",
                "bbc128792f4990b1": "invariantSwap",
                "78a3b2f9ae92cc05": "deleteSnapshotProcessSnapshot",
                "226eb3131c2d4984": "closeMarketOutcome",
                "4399af27da102620": "initializeV2",
                "f50ec0d3632aaabb": "closeProgramAccount",
                "fe27de4f40d9cd7f": "acceptGovernanceAuthorityTransfer",
                "d6a569b6d5a2d422": "setPermissions",
                "19320715cff8e6c2": "senchaSwap",
                "48f43d88fd8c83cd": "delegationUnstake",
                "e25fe09ce9dfdc3c": "addPricesToPriceLadder",
                "655669c022c9939f": "jobInit",
                "6f4e5bc835f02cc2": "repayFbond",
                "ccf66a5d1b790a03": "createWrapped",
                "9e959bba840c3a22": "settleSpreadPositionsHalted",
                "62a5c9b16c41ce60": "close",
                "e02758b5243b9b7a": "approveTransaction",
                "73fb3700a6bd194a": "setReferrer",
                "991f9fcb20bb89e9": "consensusAgentUpdate",
                "7f38af8e33d815f2": "initializePriceOracleV0",
                "2c03a145ae4b89a2": "getAssetsUnderManagement",
                "747a899ee0c3ad77": "postPythPullOracleUpdateAtomic",
                "c7472a439013566d": "updateUserReduceOnly",
                "df3c7eb16d924151": "migrateFeeAccount",
                "0c705e0272f24119": "initStakingFour",
                "93ca3c604e4e81cc": "kaminoInit",
                "9ac7e8f26048c5ec": "checkPermission",
                "ceb0ca12c8d1b36c": "stake",
                "72beaf3bcf5d195a": "setWooconfigNewAuthority",
                "cf52c091fecf91df": "migrate_to_amm",
                "208eb89a6741b858": "updateFeesAndReward2",
                "32852d56754273c3": "set_token_accounts_states",
                "49e8f43e7b677227": "meteora_dlmm_claim_reward2",
                "f2307f5b18bbd3ea": "manage_collateral_claim_orca_fee",
                "8a7f0e5b26577369": "buy_token",
                "87f90d4a3dbebc21": "add_node_to_registry",
                "8f6c69e3c51d8195": "buy_fix_token",
                "71841f4a63a93992": "commission_sol_swap2",
                "d0e1d352dbf23ac8": "epoch_maintenance",
                "f31418f7ee945e3e": "resetLockup",
                "79ad9c285d9438ed": "lendingPoolConfigureBank",
                "22ceb5170bcf935a": "claim_locked",
                "4d55b29d3230d47e": "initializePermissionedPool",
                "0d58cc72f5c376b6": "completeNative",
                "e909bd44e0a3f5c1": "perpCancelOrder",
                "a78a4e95dfc2067e": "collectFundFee",
                "7835fc6fd0758bfe": "setPerpetualMarketParams",
                "a3b52a2edbd30785": "createAppXnft",
                "a00dfb85fae8e118": "reborrow",
                "4e98c4a344b37948": "closeOpenOrdersV2",
                "1c12b84607f50e2e": "perpUpdateFunding",
                "b817ee6167c5d33d": "buyV2",
                "b519f944ba544d36": "unstakeProcess",
                "dc412be989d7bbe5": "setValidationHash",
                "f48932f38bee481c": "adminDeleteShortReferrer",
                "24bbcbb67bbdd312": "approveLoanByAdmin",
                "8ddd7beb230991c9": "changePool",
                "0d25dc4417152a89": "tokenDepositIntoExisting",
                "1768dcf21b519fb9": "setFuturesMarketStatus",
                "381100a3870b8720": "activateTransaction",
                "218955854de0aefd": "ocpDepositSell",
                "c360ed6c44a2dbe6": "twoHopSwap",
                "5b9a18576a3bbe42": "deleteInitializedPerpMarket",
                "233e90b1b43ed7c4": "updatePerpMarketNumberOfUsers",
                "f98cfdf3f84af0ee": "initializePythPullOracle",
                "861390a55ef0d25e": "cancelOrdersByIds",
                "c8785d884526c79f": "settleRevenueToInsuranceFund",
                "84bfe48dc98a3c30": "initUserFuel",
                "07d60c7feff7fd75": "create_slash_event",
                "bf79143ea1126a05": "createWithdrawPosition",
                "9bcdccbaa56e32c5": "closeWithdrawPosition",
                "c93de87c862a529e": "prepare_gt_bank",
                "e312d72aedf69742": "set_fee_recipient",
                "11fa1ab284a91a33": "set_expiration",
                "8f72add00a163409": "setGuardianAdmin",
                "e6d7527ff165e392": "removeLiquidity2",
                "f020b39a606e2b4f": "token_close_account",
                "3e8e84d1ce084faf": "claim_interest",
                "d553fd6b59ad19fa": "add_resolver",
                "1acf03a8c1fc3b7f": "execute_slow_relay_leaf",
                "89327a6f59fe0814": "claim_airdrop",
                "42e50b366da455ee": "solDepositBuy",
                "f5452df558bd51ee": "updateCollectionInfo",
                "59224ba87a2fb92d": "lend",
                "30335c7a51137029": "testInit",
                "8884f67e7268e521": "initializeSrcContractAddress",
                "29b5414755415cc4": "rejectLoanByAdmin",
                "062dab2831811759": "executeSplit",
                "a8f9bc0f54d25a50": "closeMarketMatchingPool",
                "9d356b68b8bd64dc": "migrateToCrossMarginAccount",
                "851d59df45eeb00a": "increaseLiquidityV2",
                "2da269622c15ab7f": "expireSeries",
                "b2901ad8f1bbce82": "trade",
                "876ca04a156f17be": "rollbackKnockOutEvent",
                "22965df48be1e943": "setCollectProtocolFeesAuthority",
                "0122f269d7d39d12": "treasuryMovement",
                "228502a4c7f66cb3": "redeemFbondsFromAutocompoundToPair",
                "9f0cabfe8dc67a07": "executeSaleRemainingAccounts",
                "b48ba847da42fcf5": "initSpotOpenOrders",
                "23f3c2fd9728e5fb": "setFeeBeneficiry",
                "9ae6fa0decd14bdf": "updateFeesAndRewards",
                "47ac1519b0a83c0a": "getLpTokenPrice",
                "c27b28f725ed7777": "refreshStake",
                "f34fcce4e3d064f4": "postMultiPythPullOracleUpdatesAtomic",
                "f14a727bce9918ca": "updatePerpMarketAmmOracleTwap",
                "230d6fdc67d9ae73": "adminRemoveInsuranceFundStake",
                "184ee87ea9b0e610": "updatePerpMarketConcentrationCoef",
                "19ad13bd04d340ee": "openbookV2FulfillmentConfigStatus",
                "5ec62114c0612c3b": "updateWhitelist",
                "e97047427921b2bc": "initCpiContextAccount",
                "c693b2f9dc0ea421": "removeLockedStake",
                "454ad9247375614c": "approve",
                "ad483ecc3c28f3f3": "updateSusdRate",
                "97be66887f4de700": "update_yield",
                "3c9d3e3fdb2ecf54": "deposit_to_treasury_vault",
                "75da7cc4c12c83e8": "remove_tld",
                "d49ec3aeb3690961": "stake_pool_deposit_stake",
                "4c0f33fee5d77942": "burn_tokens",
                "4e006f1a070c29f9": "crystallize_fees",
                "ebb3aa4040391145": "jupiter_gov_new_vote",
                "365393c67b61da48": "toggle_paused",
                "607ee12fb9d5323a": "split_trading_fees",
                "d22b65d7778c6ada": "initiate_authority_transfer",
                "f98a31f745200baf": "compute_delegations",
                "7a0315de9effee9d": "updateVaultConfig",
                "450ddfccfb3d6906": "relay_root_bundle",
                "c4bba6b3039296f6": "unsafe_deposit",
                "589af8ba300e7bf4": "closeMarket",
                "4086c96ad0d7aa33": "completeMarketVoid",
                "d9e6631f0113060d": "takeSnapshotCreateFrame",
                "1877b43b7be80dbb": "initializeMarketOutcome",
                "4a3dd84cf45b1277": "initializeCollateralInfo",
                "816fae0c0a3c95c1": "flashSwapUnevenVaultsStart",
                "68310fab1f27e725": "stakeGemFarmStaking",
                "5003c9cbf5b83305": "setStopTap",
                "24996a17e93a487c": "updateMarketLocktime",
                "8a362201e9b4c1f0": "updateTokenMeta",
                "86502689a515727b": "changeBlockBuilder",
                "a8db8bd3cd987d6e": "queueProposal",
                "03476df1a50e2613": "updatePricingHalted",
                "f35135a7d7b7fc16": "activateRegistration",
                "e2eebb11a099fea0": "perpCloseMarket",
                "8388c2270b320ac6": "tokenUpdateIndexAndRate",
                "06874493e552a971": "initializePermissionlessPoolWithFeeTier",
                "476c8d9fd717d256": "configSsl",
                "771ba18b154e8242": "unstakeInstant",
                "62cd93f3124b53cf": "updatePrelaunchOracleParams",
                "72b86625f6bab463": "updateSpotMarketOracle",
                "07dd67996b391bc5": "initializeOpenbookV2FulfillmentConfig",
                "d5581a0925bac13b": "addVest",
                "038ef4d5a6d9ba30": "initFourVesting",
                "a4653b418bb287bb": "add_pauser",
                "826ea01e4d0d8de4": "setPoolMaxNotionalSwap",
                "39152b13562419ac": "stake_pool_deposit_sol_with_slippage",
                "0536d5704be87525": "updateReserveAllocation",
                "e027d04408e217d6": "close_fill_pda",
                "cd2222e0cc6751b0": "claim_relayer_refund",
                "880b20e8a17536d3": "lock_tokens",
                "a39da184b36b7f8f": "toggleMaxLock",
                "522f14166c3bf573": "voteV0",
                "3455a9868a744e12": "updateRewardableEntityConfigV0",
                "7327a14daffc988d": "setPercentFeeBps",
                "0c56b52eec027c89": "createSplitReciever",
                "c3e10b7f8a355ded": "registerShortReferrer",
                "3939b931a769aa73": "delegationWithdraw",
                "3f825ac527108fb0": "collectRewards",
                "0f49567c4bb714c7": "vrfPoolRemove",
                "34116084470455c2": "verifyCreator",
                "7917126e2b6f20fe": "revokeMakerV0",
                "49e2f8d705c5d3e5": "emergencySwap",
                "886c58f5e6e06552": "initializeCombinedSocializedLossAccount",
                "447d2041fb2b2335": "auctioneerExecuteSale",
                "4ac6c356c163014f": "createDecreasePositionMarketRequest",
                "c2771c28ff08e4b2": "buyEggs",
                "c9f8be8f562bb7fe": "managerWithdraw",
                "33b6f3246bf2b0b2": "changeDelegatedSubDaoV0",
                "ffc3051b5098f281": "tempBackfillMobileInfoDataV0",
                "13d8c1f4162fb440": "setBumps",
                "35924408127511b9": "deleteTokenBadge",
                "32569c49954ea386": "unstakeRequest",
                "ede119edc12d4d61": "updateStateMaxInitializeUserFee",
                "17b26fcb49168c4b": "updatePerpFeeStructure",
                "e2032e8e9b2e7144": "processOrderMatchMaker",
                "1513d02bed3eff57": "lock",
                "0bb9e3372720a80e": "update_governance_authority",
                "7f40258aadf3cf54": "meteoraDlmmSwap",
                "10966a0d1bbf6808": "setRouterSplit",
                "b5b8e0cbc11db1e0": "set_status",
                "ecb50347c21297bf": "closeUserAccount",
                "acc78fce34684f96": "mock_distribute_loss_recovery",
                "1def4c29153b592a": "unpause_whitelisted_mint",
                "4d1ece0eae2ad0d4": "remove_token_from_treasury_vault",
                "b807f0ab672fb779": "initializePresetParameter2",
                "a9b2759ca9bfc774": "token_transfer_checked",
                "92ccf1d55615fdd3": "shutdown",
                "f519ddaf6ae5e12d": "transfer_owner",
                "6bf883ef98ea3623": "swap_sol_for_tokens_on_raydium",
                "c6403e653ecc456c": "add_client_to_registry",
                "722a1362d4616d0d": "set_preferred_validator",
                "697cc96a9902089c": "lendingAccountEndFlashloan",
                "c905d774e65c4b96": "lendingPoolCollectBankFees",
                "bbc076d43e6d1cd5": "tokenSwap",
                "96460d8709cc4b04": "closeExpiredListing",
                "f2634acb660ff951": "removePricesFromPriceLadder",
                "74137b4bd9f4452c": "openMarket",
                "ef5a8764eda8d52d": "editSubAccountMargining",
                "91b20de14cf09348": "repayObligationLiquidity",
                "0bcb5d3ebbdc1d6d": "revealLotTicketByAdmin",
                "6d4b4599acda9213": "depositV2",
                "8cb936ac0f5e1f9b": "initUpdateTswap",
                "bbb36ba291a6b0e7": "migrateV2LoanEscrow",
                "7fefaf2748f42f21": "setIsFeeRefund",
                "0930dc6516f04ec8": "getPoolInfo",
                "05bc3ad65c3bd7ac": "pauseSrcContractAddress",
                "3f61318ae434646b": "settlePerpFunds",
                "f02f99440dbee12a": "preFlashFillOrder",
                "03d2945ea1460856": "transferNative",
                "2ab4678ace2bd062": "createDualFarm",
                "ba8fd11dfe02c275": "twoHopSwapV2",
                "cf2d57f21b3fcc43": "initializePoolV2",
                "3ba964314511adfd": "deletePrelaunchOracle",
                "b93574a9aa90d852": "updateFreeze",
                "314df610fe5a1dce": "initUserStaking",
                "d43ee5cd8d02dce2": "initiateBatchDeposit",
                "4fd3e88c084edc22": "perpsRemoveLiquidity",
                "0d5707856d0e5319": "close_epoch",
                "de7e24cdc1adc2e0": "close_lender_accounts",
                "819446df1bc23730": "update_limit_and_commitment",
                "177d61f0106c5558": "realloc_pool_config",
                "85b967a25aa14e8f": "drift_initialize_user_stats",
                "057c6555feafb8f9": "liquidate_ledger",
                "b1053f0959e9274b": "delegate_node_account",
                "1e21d05b1f9d2512": "commission_sol_proxy_swap",
                "28e888d5b623c784": "execute_migration",
                "ab48e95a8f977133": "logVoterInfo",
                "e29e014a54711898": "emergency_delete_root_bundle",
                "9a27c93446454bd1": "claimGemFarmStaking",
                "4b08ff297b3b87ee": "updateInterestRate",
                "bd2eff217e852bab": "initializeMarketStrikes",
                "1bd59fbf0c747079": "pruneOrders",
                "ce56fb1b5b6f17d3": "initializeSpreadAccount",
                "bea6598b2198100a": "aldrinV2Swap",
                "a96918f0aee9a4a6": "depositLiquidityToPair",
                "cac7d36207b59a2b": "liquidateFullPosition",
                "bec1f9f15f02b9e5": "extendLoanTerm",
                "64571ebebf0ea462": "set_treasurer",
                "5c2cd2bbac0640b7": "thawNft",
                "3ebb7d451add9d85": "editOrderPegged",
                "d31c3020d7a02317": "update_reward_funder",
                "67f9e5e7f7fdc588": "closeOpenOrdersIndexer",
                "efcb8d54684afb3d": "tradeXChain",
                "41d3d493ef9a8502": "updateXnft",
                "5831d6f2e52cab34": "aggregatorSetHistoryBuffer",
                "1a6d0151660f066a": "cancelRequestWithdraw",
                "00e803c37c756935": "crank",
                "02d0debe6d94f775": "extendLoan",
                "ee0e89b59c9d371b": "setFixedFee",
                "a06871b32a500810": "tradingCloseBorrowCollateral",
                "a8be9dfc9fe2f159": "leaseInit",
                "872ccdc6190148bc": "new",
                "c60bfa7fa87629d7": "initializeOptionBarrier",
                "dc398aa7c945e0e0": "setFuturesMarketAuthority",
                "0deca4ad6afda4b9": "configInit",
                "78f0f6b3a66d80d3": "initStakingOne",
                "78c90a660c096f7e": "cancelStopLoss",
                "a6ddad51b1f77752": "cleanupPositionTakeProfit",
                "c5c085da3f47990b": "earn_vault_deposit",
                "dad1f4edd3ec623a": "set_inv_t_max",
                "8c997d096463b1c8": "remove_yield_distributing_lender",
                "b8e2e6aa1e78e509": "update_domain_metadata_url",
                "8f5dc78f5ca9c1e8": "multisigSetConfigAuthority",
                "7a00d63b3f9edb00": "setWooCoeff",
                "33ca9a824184f2bc": "declare_loss",
                "42bc47d3626d0eba": "initializePresetParameter",
                "ca03211bb79c39e7": "marinade_order_unstake",
                "4e3b98d346b72ed0": "setPairStatusPermissionless",
                "ba752a18ddc2228f": "meteora_dlmm_close_position",
                "a860b7a35c0a28a0": "fill",
                "600ab7eebbf86024": "remove_node_from_registry",
                "5180864972492d5e": "commission_sol_swap",
                "76e6d74b5302a323": "start_distribution",
                "a976334e916edc9b": "initialize_virtual_pool_with_token2022",
                "7712d841c0757adc": "pay",
                "a20b388b5a8046ad": "lendingPoolHandleBankruptcy",
                "6a4927b8974ab742": "inscribeLegacyMetadataAsUauthV3",
                "31741242433ed628": "totalSupply",
                "03294fea7ed8af6c": "deleteTestPair",
                "856d2cb338ee7221": "removeBalanceLiquidity",
                "e60921cae4d1b462": "updateOracleBackupFeed",
                "df32e0e39708736a": "addConfigLines",
                "6a1f92c3676c30fa": "getDecreasePosition",
                "aeea50891a95f41d": "depositV0",
                "9162c076b8937668": "mintV1",
                "d9650a47e7dcf1ca": "deleteReview",
                "c2f813e7e3aa69d5": "triggerSecurityAgent",
                "95a102d5c3932a41": "withdrawLpFee",
                "d727b429ad2ef8dc": "redeemFees",
                "dfede34898b9ea73": "perpSettleFees",
                "397d153bc889b36c": "decreasePosition",
                "060b33935de72723": "ledgerTransferPositionV0",
                "d4e9c9bae2e0318f": "marinadeFinanceDeposit",
                "bb42f920f4082cc3": "updateMapleAccount",
                "2c56a2d2758b0e44": "registryLock",
                "b97500cb60f5b4ba": "flashRepayReserveLiquidity",
                "6d1c873aa2d67126": "tokenRegister",
                "816a2b04348f66d0": "burnWithoutTrackingV0",
                "6db197f2e3824f25": "forceClosePosition",
                "15dd8cbb20810b7b": "updateUserCustomMarginRatio",
                "351088841edc7955": "updatePerpMarketPausedOperations",
                "11a4522db756bfc7": "adminDisableUpdatePerpBidAskTwap",
                "ea200c477e05dba0": "exit",
                "92e2f03277e22df7": "kaminoRedeemReserveCollateral",
                "4b8019dcc70c53e8": "protocol_change_owner",
                "4d9b04b372e9a22d": "cancel_redemption_request",
                "9025a488bcd82af8": "proposalApprove",
                "ee26c16ae420d221": "getPrice",
                "9248aee028fd54ae": "goToABin",
                "2bd7f784893cf351": "swapExactOut2",
                "6d6241fcb800d8f0": "jupiter_vote_withdraw_partial_unstaking",
                "ebf5de3af58013ca": "drift_modify_order",
                "2fd52411b7058d2d": "price_vault",
                "04695ca7841c095a": "updateWhitelistedWallet",
                "35e6ac544dae163d": "deploy_bonding_curve_fallback",
                "1723ecb90eab1ade": "rngSettle",
                "268652d85f7c1163": "close_claim_fee_operator",
                "5e28dc7c7a8e8e62": "set_new_authority",
                "746e1d386bdb2a5d": "burn",
                "67e261ebc8bcfbfe": "createMarket",
                "02c4835c1c8bb35e": "updateProject",
                "f2e7b1fb7e919f68": "setTestTime",
                "83527d4d0d9d245a": "sellNftTradePool",
                "59fca75d3cf759c4": "unstakeCompressedNft",
                "0490844774179750": "claimRewards",
                "f30608177eb5fb9e": "updateTokenMetadata",
                "1e1e77f0bfe30c10": "liquidUnstake",
                "5cbb212e20fb2155": "setOracleProducts",
                "403e62e2344a25b2": "saberSwap",
                "5343d6ca65214d41": "settleSpreadPositions",
                "2656593d0ea0bf4e": "crankPriceHistories",
                "6e827329a466023b": "depositStakeAccount",
                "fd574f6fa53257fb": "setAccountDelegate",
                "d37d03692d21e3d6": "vaultTransfer",
                "c9b274d4a69048ee": "updateFundingRate",
                "c8d83fef07e6ff14": "closeOpenOrders",
                "9d0777b85012349f": "initializeFlashLoanPool",
                "904d0769544700f1": "updateXChainPoolAuthorization",
                "6f988e99ce271694": "aggregatorSetQueue",
                "91cc0bd1ae864f3e": "tokenEdit",
                "8080d05bf6351fb0": "updateFeeParameters",
                "c453f3ab1164a08f": "cancelAllOrders",
                "8040c574e28177ea": "levelUp",
                "b6716fa043ae59bf": "updatePerpMarketOracle",
                "f717ff41d45addc2": "updatePerpBidAskTwap",
                "e6bfbd5e6c3b4ac5": "updatePythPullOracle",
                "7f4275392832987f": "settleMultiplePnls",
                "1300074409820ff1": "processOrderMatch",
                "3867fc3db48ccb64": "patchCustodyLockedAmount",
                "855b586dd162fcbd": "createDvypassV2",
                "eea18785762be904": "reallocateHouseAccount",
                "d816fec3bf4d5b14": "earn_vault_change_price_oracle",
                "68688356a1bdb4d8": "swap_exact_in",
                "79b035d1ce1579a1": "mock_distribute_loss",
                "d0452473d12c4dab": "swapMeteora",
                "2246c82598edffd8": "initialize_treasury_vault_config",
                "ed51fc86d76655b7": "fund_locker_authority",
                "322b9d468f5cd95a": "claimFeeAmount",
                "a3d74974c7ad7aa5": "setPoolFeeRate",
                "db2132ed25659265": "meteora_dlmm_swap_with_price_impact2",
"dcfafd66f61c68b0": "A",
"00775ac76515118a": "AbortTransaction",
"cc94a83e7379785b": "Above",
"664ce525ca8acecf": "Absolute",
"6a5cb3316a347b2e": "AcceptTeamApplication",
"2c343329830c2b02": "AccessControllerSet",
"0f777d5ba94ea2c9": "AccessMetadata",
"7142e036bc77f065": "Account",
"45f6a986f42c83fc": "AccountClosed",
"3f57bdf7ecb45e92": "AccountCreated",
"c8a687b5e287c487": "AccountDifferentThanExpected",
"7ccd54d4afb3eeb7": "AccountDisabled",
"9496e57174f75534": "AccountEventHeader",
"7fc2daa460d60587": "AccountFullySized",
"c898b1bbbd6ee53d": "AccountInFlashloan",
"dac22ca233225a66": "AccountingInvokeBegin",
"2e22aceffe17e8a4": "AccountingInvokeEnd",
"fc06d94a58b56359": "AccountLack",
"a35f136070d9e7b7": "AccountList",
"c6b0c19858d3d985": "AccountNoLamports",
"a8220f1febbf90b1": "AccountState",
"c73f4da83c437441": "AccountsType",
"1cb45ba3067163f8": "AccountsUninitialized",
"3cced833770e6ec6": "AccountTempActiveBalanceLimitExceeded",
"2a491fee94407062": "AccountTypeVersion",
"2952a0f03f004579": "AccountUpgradeFailed",
"fee36182e1ef1616": "AccountVersion",
"860b45645a84aebb": "AccountWindowedCircuitBreakerV0",
"3f8f46c5ce67479e": "AccountWithdrawSol",
"3edc8385581c1957": "Ace",
"1efda28e1ea0423e": "Achievement",
"f9b78d453157bf08": "Acl",
"90f169db4a88cbb0": "Action",
"f672e352a66233a9": "ActionFlagContainer",
"e06ece531a24b565": "ActionHeader",
"2f91f1b461f43758": "ActionRequest",
"7b28ad9791bc06d3": "ActionsAfterRebalanceDelaySeconds",
"a07b0dd7889f587b": "ActionsAuthority",
"44df3be3b4568eb4": "ActionState",
"12e9166ecf126683": "ActivationType",
"5a2f6c75dc2d5597": "Active",
"8574600fe75e8a87": "ActiveAccount",
"1932d8f4bf3a340d": "ActiveBets",
"984c66aa38708f8a": "ActualLoanDurationExceedsFilter",
"5a4fe473f9ca575d": "ActualLoanToValueExceedsFilter",
"da619233530e1efc": "Adapter",
"31f2674ce1fdf3f1": "ADAPTER_CONFIG_SEED",
"ee14bf06a19a5a02": "AdapterCollateral",
"e8eedd7b37391b0e": "AdapterConfig",
"9ac3ea29122cf439": "AdapterConfigured",
"05d95afa6cd9b676": "AdapterInvokeBegin",
"ef4c5507d9022233": "AdapterInvokeEnd",
"e8fe140f87cc57a1": "AdapterType",
"333261a8d2d1b8f1": "AdapterWhitelist",
"ac6d26ae2ca5244a": "AdaptiveFeeConstants",
"931090742f92952e": "AdaptiveFeeTier",
"1eabe142a735499d": "AdaptiveFeeVariables",
"6963db9b4df10777": "AdaptorAddReceipt",
"eb0d11824167ff01": "AdaptorEpochInvalid",
"0a676f4c6beef2c9": "AdaptorID",
"4b3fe643129a07d6": "Add",
"342115e0aab94591": "AddBlocker",
"94afb80cd14f72c4": "AddCollateral",
"70915f6014acd7e3": "AddCollateralLog",
"50387c0cdadb2a49": "AddCollateralLogV2",
"2723e246d9ca86c6": "AddCollateralLogV3",
"553ecbafe1418e68": "AddCollection",
"fd5e2c9cb8308138": "AddCompoundingLiquidityLog",
"c57774f60bdb8c15": "AddCrewInput",
"e14e0ec6d06d68c1": "AddCronTransactionArgsV0",
"4456314c60f93877": "AddCustody",
"aafe7469b9ecf024": "AddedStakedPoolManually",
"babebc11ed78d5c5": "AddEntityToCronArgsV0",
"dc7988ed33c1b11d": "AddFee",
"6d04ca39205f7a5f": "AddInternalOracle",
"ea8c8e0779e030ad": "AddItemRequest",
"11c872b8c34bed01": "AddKeyInput",
"c503a991cc16b295": "AddLiquidity",
"85186b9593d93461": "AddLiquidityAndStakeLog",
"b4b2f76b7998f120": "AddLiquidityData",
"86baecf3074c5e09": "AddLiquidityLog",
"ef3be778aad01e1f": "AddLiquidityLogV2",
"c870da8d4c8aa8da": "AddLiquidityMaxBaseExceeded",
"eb8347a2bf1195db": "AddLiquidityParameters",
"263201d406647eb2": "AddLiquiditySingleSidePreciseParameter",
"c3cb4ca279c14c24": "AddLiquiditySingleSidePreciseParameter2",
"d15c4a0ae285cc07": "AddLiquiditySlippageExceeded",
"73b5dea3b5055185": "AddMarket",
"72c87d4c65a9d39a": "AddMember",
"fe5731d3cdb1c0f8": "AddNewUserToTopHolder",
"c6f24d9c4da9ce57": "AddOperatorFailed",
"b60a315cea7c2b0f": "AddOrDelWhiteList",
"15b10b543df922ee": "AddPointCategoryLevelInput",
"6c49027cbb40f533": "AddPool",
"e54add23f58a3254": "AddRecipeIngredientInput",
"48341627c64e78fe": "AddRedemptionEpochInput",
"218d8546949744ac": "Address",
"64db728e21b58722": "ADDRESS_MERKLE_TREE_CANOPY_DEPTH",
"3088a6f8b915d09e": "ADDRESS_MERKLE_TREE_CHANGELOG",
"e54d474573bc4f55": "ADDRESS_MERKLE_TREE_HEIGHT",
"fb9a4e6e1f4f0b07": "ADDRESS_MERKLE_TREE_INDEXED_CHANGELOG",
"523b48a701cb0b00": "ADDRESS_MERKLE_TREE_ROOTS",
"85b158b21e5ed13b": "ADDRESS_QUEUE_SEQUENCE_THRESHOLD",
"cba627a6a1b8e2d5": "ADDRESS_QUEUE_VALUES",
"23d10ff1a4851d5b": "Addresses",
"9ceeaaceac9819fa": "AddressGate",
"0ba1af09d4e54949": "AddressMerkleTreeAccount",
"dc21a0276da179c9": "AddressMerkleTreeConfig",
"0fe161b021e8f23d": "AddressQueue",
"4cb68ab03701fca2": "AddressQueueConfig",
"177e51e5b0556553": "AddShipEscrowInput",
"251f74836dffcb57": "AddShipToFleetInput",
"17c16569ed241d98": "AddSpendingLimit",
"b6ef400926312bed": "AddToken",
"0ee9c63ec1e05abf": "AddWalletToEntityCronArgsV0",
"f49edc4108490441": "Admin",
"bb1f267cb0c95c4a": "ADMIN",
"19a50abeadc32367": "ADMIN_PUBKEY",
"9977b4b22b42eb94": "AdminAccount",
"e2cf763597182435": "AdminAuthority",
"21183b4d44480910": "AdminAuthorityIncorrect",
"8a643a9a15ab29e8": "AdminChange",
"9c0a4fa147093e4d": "AdminConfig",
"6d487abbe452ac4f": "AdminControlsPricesDisabled",
"7f3adb171db7f24c": "AdminInstruction",
"81ebbf62f35ed332": "AdminRoleData",
"048fa8afef3b4e8c": "Admins",
"d56935c3e485e487": "AdminTransferred",
"df89bc6b7e872867": "AdminWithdrawTooLarge",
"ace18f4f428795c7": "AdrenaLp",
"de2ba074a3fd74e7": "AdvancedLp",
"4abc0fd040050323": "Africa",
"8cfc1c09f9084ec8": "AfterEndDate",
"f0de52b2e5ee48db": "AfterMinDuration",
"ce8b7194a3222cbb": "Aggregator",
"d9e64165c9a21b7d": "AggregatorAccountData",
"5a474e24e14071fa": "AggregatorRound",
"70f98bd9d7d0f936": "AgPriceFeed",
"5851ab753187272b": "AgroPool",
"7d9e418dc5f427a0": "AIOriginalDataAccount",
"efaffb3b27b68a3c": "AirdropBonus",
"d968feaadb58e047": "AirdropHBBBlocked",
"0e9a6826fa6d2d65": "Airspace",
"f4e92ce57057c858": "AirspacePermit",
"bd08aac36a64cdbe": "AlchemistStillRenting",
"b94796fe06c24f01": "Aldrin",
"63e369fbdb62c5d3": "AldrinExchangeV1",
"e1ab960980025130": "AldrinExchangeV2",
"3bbb343419932ef1": "AldrinV2",
"7cae0fd82c2898cb": "All",
"676be161827cef1b": "Allbridge",
"939a03b19b1983b0": "Allocation",
"0a5e72bad23cfe9c": "AllocationAdmin",
"65396ebc507ee885": "AllocationLimitReached",
"87c18701d46b98bb": "AllocationTracker",
"9baa6ceff965577a": "AllowDepositWithoutInvest",
"4acc086a1f377741": "AllowedBroker",
"70d2b628ad7e6ff4": "AllowedMintLimitReached",
"3388dea12607b8be": "AllowedPriceUpdater",
"f8e7cab0665461bb": "AllowedToken",
"bc4dd2720dce142f": "Allowlist",
"58776a09c04a258e": "AllowList",
"137acf72cf2be994": "AllowListProof",
"62c3e60bfe6dc6c6": "AllowMultiAttribution",
"f385baf33210ed75": "AllowMultiLevel",
"904f2d2f75532ce5": "Alt",
"51e3451c1407fd42": "Ambassador",
"7d81b6d41debce48": "AmbassadorClaimed",
"8ff5c8114ad6c487": "Amm",
"3c8eb8a82c1dbc46": "AMM",
"8080ea1e3dacbc7b": "AmmAdminGroup",
"a79f48320b456fde": "AMMAvailability",
"daf42168cbcb2b6f": "AmmConfig",
"414926b7b59fe16e": "AmmCurve",
"9c5625c912b4cca2": "AmmFees",
"838785e088d64b46": "AmmFill",
"656207697a5f8b9f": "AmmImmediateFill",
"2e8bfb8f392e6d02": "AmmImmediateFillPaused",
"13cde4d721755faf": "AMMLiquiditySplit",
"3d8b933399085810": "Ammo",
"ad49fc30d4c705dc": "AmmPaused",
"292de2e86f469716": "Amount",
"e1e6da2216e3944e": "AmountAndFee",
"b8b43b3cdf079e57": "AmountKind",
"e21cd81c6f80c8ab": "Amounts",
"82eb4969e8221c25": "AmountWithSlippage",
"4bd65e9ec6971012": "AmountZero",
"a2f061bd5193aa3d": "And",
"4638a727ea092096": "Antarctica",
"cacf38e1158ff1c8": "Any",
"d130d00490707fe9": "Any2SVMRampMessage",
"6d870d40204f52af": "Any2SVMTokenTransfer",
"9fb24b1c95a98174": "AnyNode",
"5059110299c5884a": "AppendStateFailed",
"a063529e99e51ded": "ApplicationData",
"439600d738deb425": "ApplicationDataEventV1",
"89a014212b547f52": "Applied",
"201b750356c21817": "ApplyToJoinTeam",
"4d748eaa369620c2": "Approve",
"dafdaa02042f1963": "ApproveAccount",
"8fbe3d9c33d5b32c": "Approved",
"cac425af8e2783a3": "ApproveProgramArgsV0",
"7a58c5d38b010007": "ApproveTransferAuthorityFailed",
"cc7b5cfcd9e03279": "ApricotWithoutLM",
"32d455e3ecf1eaca": "ArenaBankLimit",
"6739540920f018de": "ArenaSettingCannotChange",
"72a416aeec98118e": "Arithmetics",
"d8785a798b456692": "Asap",
"dc536d88d4588fca": "Asia",
"e1a97b2202fdc6e4": "Ask",
"fcc651b1d1fb9643": "AskFixed",
"217d242b8f2f36cf": "AskNotCrossed",
"7bd8bb9ce6330f98": "AskOraclePegged",
"3e07d1efc5daacf6": "Asks",
"ce90d26f788b11ea": "AssertFailed",
"7f9ae2e59fcbed76": "AssertUserBalance",
"eab4f1fc8be0a008": "Asset",
"9312633af908c4dd": "AssetDepositReceipt",
"1187564a6abd59eb": "AssetId",
"952963b4e94d967e": "AssetPod",
"513002d793ff9870": "AssetPool",
"01076bb799365b50": "AssetPoolContainsOfflineOracleToken",
"c5d0e2577e41555f": "Assets",
"14207ff2f75ba810": "AssetsInLiabilityBank",
"e9e584aaa9e162ab": "AssetState",
"50ce52c442685f8e": "AssetTier",
"839db7de68258f3f": "AssetType",
"e011749de6d41eda": "AssetV1",
"30593189ea45cef5": "AsteroidBelt",
"097caa1795065f2e": "AsteroidExit",
"117731f8f7ca6a8e": "AtaNotFound",
"f6abe890daec21a1": "AtlasRateAccount",
"826a674fef5dc6bc": "AtLeastOneDVN",
"77c3f023386f85cb": "AtoB",
"463b0ffc9ea234c8": "AttesterDisabled",
"7cf26764205fd53c": "AttesterEnabled",
"b08b5751be51d36d": "AttesterManagerUpdated",
"c33447686295dba5": "Attribute",
"1107b0cd215660d5": "Attributes",
"da5ef7f27ee98351": "Auction",
"0f0fc2f54b8cb722": "AuctionBin",
"67083e9f18b91ad2": "AuctionClosed",
"480f6423f237015d": "AuctionData",
"286cd76bd555f530": "AuctionHouse",
"c74745480b00a65c": "AuctionIsNotClosed",
"4746aa8311c8fa50": "AuctionIsNotFinished",
"fcc08fe15a007ee1": "AuctionNotComplete",
"fce3cd934840fa7e": "AuctionState",
"1d52f392d31c4970": "AUMBelowPendingFees",
"38440841c2be8dfc": "AumCalcMode",
"f6da721910491cd9": "AUMDecreasedAfterInvest",
"ff9bacbb79489f61": "Australia",
"1085458089d3cb75": "AuthInvalid",
"249d6b43bf7eb5ed": "AuthKeyCannotExpire",
"5e1fb798dd618fc8": "AuthKeyMustSign",
"64e5f32eec4531de": "AuthorisedOperatorListFull",
"51fb4b3e81135f45": "AuthorisedOperators",
"246cfe12a7901b24": "Authority",
"c487881b33fadfc5": "AUTHORITY_SEED",
"8c87fe1ed94dfb7c": "AUTHORITY_SIZE",
"c6d47c31b6ad4e91": "AuthorityAdapter",
"4110f8f21143fa0c": "AuthorityAdapterType",
"61d41b8ebe13b46b": "AuthorityFarmDelegateMissmatch",
"66cbb24378a73a98": "AuthorityHasToMintForSelf",
"d9db12b38f7e627b": "AuthorityState",
"257bcc6e0f05dc09": "AuthorityType",
"f73e01ed1142e126": "AuthorizationDataLocal",
"b871409e69afabaf": "Autocompound",
"e95b54896f62221d": "AutocompoundAndReceiveNft",
"c3b24df2a7d11751": "AutoCompoundAndReceiveNft",
"998ce5c8e0a2bf0c": "AutocompoundDeposit",
"6549d295c0162bec": "AutocompoundDepositIsNotActive",
"4db09ba3af07ddac": "AutocompoundDepositState",
"99ad95bffacfb51c": "AutocompoundFeatureNotEnabled",
"841944a64fc3a7f5": "AutocompoundNotSupportedYet",
"3ab0d1ddcd159c1e": "AutocompoundType",
"b2177d743ce0c87a": "AutoDeleveraging",
"87a067765df01cfa": "Autodrift",
"82b9928d13af17d4": "Autodrifting",
"f33c4371559cae6f": "Autograph",
"006aca3835801d9c": "AutographSignature",
"4bd5ca8a5690195a": "AutoReceiveAndReceiveNft",
"f5d360350e623d6b": "AutoreceiveSol",
"752d8b36aa8d25df": "AutoreceiveSolToUserFeatureNotEnabled",
"0a0f02c1c27cd527": "AutoReinvest",
"488e635c34912c02": "AutoReinvestNotEnabled",
"216db5dffdec9b27": "Available",
"dec32f549efab02c": "AVAX",
"7ab45926ffe423f4": "AVAX_EMA",
"e26829f5f7a09a60": "Avg",
"f74a0cbb4f7403ae": "Awaiting",
"4fc68a4bb5113932": "AwaitingOracleResponse",
"3d1d8f572d2d8768": "AwaitingPlayerResponse",
"241ed4cf2b636ba3": "AwaitingPlayerUpdate",
"682bc2300f9b4ba2": "B",
"f540e4ac7cce3368": "B58",
"1bda5be561924b73": "Baccarat",
"d35c33eb6fbb8f71": "BaccaratHandResult",
"94ec893e5a0c25e2": "BaccaratSide",
"b98464795bdc4bf6": "Backup",
"c6223251e9a5cb49": "BackupOracle",
"5be1a5c41df358d9": "BadActivationTime",
"90057f9e37416ddd": "BadAmountAfterBurn",
"c6ea9087f8a29c56": "BadAmountAfterTransfer",
"f0c41b71e7b1b870": "BadBidField",
"5ea2210d52b26094": "BadCosigner",
"75508d0098417ab3": "BadDebt",
"e846ec041bbe13ab": "BadEmodeConfig",
"c357909c29ab591d": "BadEscrowAccount",
"99599d731e55af1d": "BadFeeAccount",
"120787144a481e1e": "BadListState",
"679fd0b77e55543e": "BadMargin",
"22c6915009468a30": "BadMetadata",
"a16ec0eb4de5d133": "BadMintProof",
"a18f24e721d91379": "BadOwner",
"384e7dfd02b28071": "BadQuantity",
"6adb512189381d7a": "BadRentDest",
"13358a95188838ef": "BadRoyaltiesPct",
"281dd42985a4e40b": "BadRuleSet",
"cc39cbb28a8a209f": "BadScopeChainOrPrices",
"e6674d7d3498ace1": "BadSharedEscrow",
"d6e63724b8d066f2": "BadSlot",
"92b8f3fd14b6accb": "BadTimestamp",
"ba3a3e4cba2e2c73": "BadTokenNb",
"0aeffc2671b9fb60": "BadTokenType",
"82f553081d855fea": "BadVerification",
"5591f6c775371b69": "BadWhitelist",
"7f47199d699df1b6": "Balance",
"5289f8b5f9d90504": "BalanceCapExceeds",
"fa59a04634f7052c": "Balanced",
"bc7416ed13c0e443": "BalanceDecreaseType",
"cd237f455fb11fef": "BalanceIncreaseType",
"656a1a7408474fec": "BalanceNotBadDebt",
"55b877663bc77b69": "BalanceNotZero",
"e244eca42d1cd505": "BalanceSide",
"1dc737309047a73c": "BalanceStatus",
"e467f965965a7b78": "Balansol",
"8e31a6f2324261bc": "Bank",
"180f7d2c89441632": "BankAccountNotFound",
"e50614bf5443bd82": "BankAssetCapacityExceeded",
"761c6558ef421308": "BankConfig",
"ba75030fed7f0e5f": "BankConfigCompact",
"eceae376e7e94117": "BankConfigOpt",
"643fd33cd85e46d9": "Banker",
"d6d9dac88d95370c": "BankLiabilityCapacityExceeded",
"5b7544fbdd4ed347": "BankNotFound",
"8e72ec4b3308d2c6": "BankOperationalState",
"bc2fbb0e99e1afbf": "BankPaused",
"07ae7926af9dd37c": "BankReduceOnly",
"eb47c911a1a8110f": "Bankrupt",
"ff5250efb9b8ad06": "BankVaultType",
"c223bd6464871d3a": "Barren",
"732219384b5645e5": "Base",
"a768b676ad2edb09": "BASE",
"d35b881707323978": "BaseAssetV1",
"1890e45a1a93edc5": "BaseCollectionV1",
"6a8d5dea889f0452": "BaseFeeConfig",
"e10f184d0b6fdbc3": "BaseFeeParameter",
"cd398f3004c06709": "BaseFeeParameters",
"0cbe62a30a454236": "BaseFeeStruct",
"ed7ce81f9504d9b4": "BaseVaultAuthorityBumpIncorrect",
"7b2a67fd24ae493a": "BaseVaultAuthorityIncorrect",
"f61062f3e7df530e": "BASIS_POINT_MAX",
"851a5f0e47c992a6": "BasisPointTooHigh",
"9cc2462c1658892c": "Batch",
"f2588d3694515bfb": "BatchBlockCreated",
"0e6865713c80740b": "BatchDepositActive",
"22298334a7e78b41": "BatchNotEmpty",
"3af573fcb86a285a": "BatchRemainingAmountNotZero",
"7e8f617b92d42955": "BatchWithdrawActive",
"d5f4287d3ed25456": "BeforeThisLotteryNeedToRevealLastResult",
"d405b4d02acac765": "BeingLiquidated",
"a7eb9b843165be98": "Below",
"355b25fc0993955e": "BelowMinimumTransactionValue",
"9317233b0f4b9b20": "Bet",
"ff7c2aea99b01864": "BET_SLIP_SEED",
"baaef53848a3bdfd": "BET_TOKEN_VAULT_SEED",
"e3d0070b467ca0ac": "BetAmountInvalid",
"3d6c09fa428a04d2": "BetAmountMustBeGreaterThanZero",
"6b3e636ec3ce3d20": "BetExtension",
"06f130155f3cbed2": "BetLimitExceeded",
"39e92fad066fd01a": "BetNotSettled",
"14cf19bf4e00b04f": "BetOutcome",
"9674f6ad0b7fb50e": "BetOutsideRiskTolerance",
"776b173269952cac": "BetRequest",
"1af3a5358efca82f": "BetResult",
"88e3e3302f75a992": "BetSlip",
"9cb779c985b60291": "BetSoloCreated",
"3ffca619cc1a8b67": "BetSoloSettled",
"87e0b328330958b1": "BetSoloUpdate",
"8f3dee3ee89d65b9": "BetState",
"3327d764e2bfbb0b": "BetStatus",
"7e36028085b8fd6c": "Bettor",
"53a69c4d61636dbe": "BETTOR_SEED",
"6ea5825fd88c1444": "BettorBackedOff",
"0d6e8791976be93c": "BettorPrimaryVaultEmpty",
"154e374f7e9b57ab": "BettorPrimaryVaultNotEmpty",
"746ed68956fb03f9": "BetType",
"541ea95e865ccf65": "BetUpdatedData",
"b130ade1430b51be": "BetV2",
"8ff630f52a91b458": "Bid",
"ffccce2f8a422ba7": "BID_STATE_SIZE",
"2ba13e78656b4e64": "BidAskBalanced",
"204bd066caa80cc9": "BidAskImBalanced",
"7968359bd887ea48": "BidAskOneSide",
"8d44bf64b991b3cf": "BidBalanceNotEmptied",
"cb1819a833baf276": "BidFixed",
"f474833a7a68233f": "BidFullyFilled",
"823a63837e84cfa9": "BidNotCrossed",
"31855bec5595da6b": "BidOraclePegged",
"1eda123127334302": "Bids",
"9bc50561bd3c08b7": "BidState",
"952514c9d423a8cb": "BigFractionBytes",
"91bbcdf5d0a60742": "Billing",
"bf5b01005dfaef29": "BillingTokenConfig",
"3fb24839ab422c97": "BillingTokenConfigWrapper",
"fe0783e1df579dda": "Bin",
"b1932ae56ff71892": "BIN_ARRAY",
"0af1534b4a071bca": "BIN_ARRAY_BITMAP_SEED",
"68be5324c4663d82": "BIN_ARRAY_BITMAP_SIZE",
"433f9388c529639a": "BinAddLiquidityStrategy",
"5c8e5cdc059446b5": "BinArray",
"506f7c7137ed1205": "BinArrayBitmapExtension",
"df374dc3283f2b7f": "BinArrayNotFound",
"a0fc37e48dd1da6c": "BinIdOutOfBound",
"959e951431a1cdec": "BinLiquidityDistribution",
"727d119ed0b112ab": "BinLiquidityDistributionByWeight",
"3e9641b4289e4776": "BinLiquidityReduction",
"2d447a0debebaeec": "BinRangeIsNotEmpty",
"5f320983f49aa9da": "BinsLengthExceed",
"13215b232399b54e": "Bitmap",
"0233a508a35ee860": "BitmapExtensionAccountIsNotProvided",
"61c2c60703edafd0": "BitmapIndexOutOfBonds",
"a45a0fa32c51c762": "BitmapIndexOutOfBounds",
"ccdd4db50252520a": "BitMask",
"87c8bf88055aab02": "BitmaskOutOfBounds",
"6b68b2dc8e82ad46": "BitSet",
"3ed8b0465295887a": "Blackjack",
"32592a7f242486e5": "BlackjackAction",
"b7fa8dbb8d693d5d": "BLNftSigner",
"15b16e794dfbec5f": "BlockAirdropHbb",
"94f7f47df561e313": "BlockBorrow",
"7e84417795d0bb8d": "BlockchainClockInconsistency",
"0e4b773dcc7c1410": "BlockClearLiquidationGains",
"c9051832b9dc16cd": "BlockCollectFees",
"44ba17b2b4cb01c4": "BlockCollectRewards",
"b7faffbee05a14c0": "BlockDeposit",
"ea28260174c80ac3": "BlockDepositAndBorrow",
"0a42aafa72d38893": "BlockDepositCollateral",
"e8651762907e661c": "BlockEmergencySwap",
"b92e6e1bad4d69e3": "BlockHarvestLiquidationGains",
"e1816400ebd0d614": "BlockInvest",
"e9e6fde622c6a6d0": "BlockLocalAdmin",
"94a02f5688219fe6": "BlockPsmBurn",
"bf61f84664386214": "BlockPsmMint",
"e6a85a9dfb5f8791": "BlockRedemptions",
"4ce99f24334b57d1": "BlockSwapRewards",
"834dc50b47ca5f2c": "BlockSwapUnevenVaults",
"32ad50113c8f7d8a": "BlockTryLiquidate",
"69f336ee7fe3abbd": "BlockUndercollLiq",
"45e58a69c6e67634": "BlockWithdraw",
"daa89450f7f3d647": "BlockWithdrawCollateral",
"f77cbaefe2cc06dc": "BlockWithdrawStability",
"692bf31c11ac26aa": "BNB",
"32cd64fcbd910b0c": "BNB_EMA",
"e08030fbb6f66fc4": "Bond",
"cfdffe593f1341ba": "BOND_MINT_SEED",
"03b4adc99d298473": "BOND_SEED",
"7fc58a9031b7ef7e": "BondChangeNotPermitted",
"79fe930bea1f45d9": "BondCollateralOrSolReceiverNotUser",
"511d5357a4ebf479": "BondFeatures",
"17b7f83760d8ac60": "BondingCurve",
"f9f538bc73fe9d85": "BondingCurveStatus",
"6df8818c46195718": "BondingCurveType",
"f31b23990fa7f5e6": "BondIssuance",
"ce388d8f0ba5bd68": "BondIssuanceNotActive",
"59f303bac8360969": "BondIssuanceNotClosed",
"195ea99ea6bbcdd1": "BondNotInitialized",
"1dd6d0fa072b180c": "BondParameter",
"3dd0e194ca1f2422": "BondPricing",
"bd110334b1f1a2a1": "BONDS_WITHDRAWER_AUTHORITY_SEED",
"f99fae52f18ab323": "BondsNftValidationAdapterRaw",
"64d8b80edd5431d4": "BondStakeWrongDelegation",
"48c5a34a7deec765": "BondStatus",
"2dcf12ababdef26b": "BondTerm",
"57f6e3d49780692d": "BondTooLarge",
"3f83efaaadcd9872": "BondTooSmall",
"1c64daad28491f5f": "Bonk",
"ccd2e71923996546": "BONK",
"30e1dae725b7e3ca": "BONK_TWAP",
"16658025733bcb47": "BookContainsElements",
"482ce18db2826139": "BookSide",
"48a09f757afb5506": "BookSideOrderTree",
"4df200eb6357a6fa": "Bool",
"d65c4bbb46079eb6": "BoolValueChange",
"f4676c53d069fd93": "BoopdotfunWrappedBuy",
"de25b3770a9e8436": "BoopdotfunWrappedSell",
"c4a9422808e1c833": "BootstrapLiquidity",
"715710775cb6f30b": "Bootstrapping",
"cacc6d2250207a2b": "Borrow",
"bc7867d92c629740": "BorrowAuthority",
"94078200eed95167": "BorrowBlocked",
"106c4f37e0be9ec7": "Borrower",
"91d305ec731b136f": "BorrowingAboveUtilizationRateDisabled",
"07b7fe96730a3fc5": "BorrowingDisabled",
"9af975914bafdbed": "BorrowingDisabledOutsideElevationGroup",
"7a263d958550ca40": "BorrowingFactor",
"349098ef3429aa2e": "BorrowingFees",
"102d9ced90c401bc": "BorrowingFeesAccount",
"a550cab52e1b22f3": "BorrowingFeesUpdated",
"de158f3c78d8f956": "BorrowingMarketState",
"bb423459a061c493": "BorrowingVaultsNew",
"a31b5c68c412b822": "BorrowLimitExceeded",
"461bef5001080db0": "BorrowLimitReached",
"d652543d68ad8ac0": "BorrowLimitsExceeded",
"e8ea98616b7302ab": "BorrowOnly",
"f38c148b20f37237": "BorrowPosition",
"a0670a4afff2301d": "BorrowRateCurve",
"4e5dab1d2211435d": "BorrowRateState",
"d46dc7c6a7e293e3": "BorrowsDisabled",
"4fcfcdc40654f486": "BorrowTooLarge",
"42d21c135ec9ffb9": "BorrowTooSmall",
"22dcea7d5265a86a": "BothPartiesNeedToAgreeToSale",
"2c65f2757474565e": "BotTax",
"c9efe805cad59a5e": "Bps",
"2fe94ba36d5e2967": "BpsNotInRange",
"c6c6afe409a35af7": "BPSValueTooBig",
"e7e81f626e03173b": "Bridge",
"c9dcd3562bf78d80": "BRIDGE",
"fe3674cf37507143": "BRIDGE_SEED",
"e723793110b4db8b": "Bridge0",
"778a7e506f50bf32": "Bridge1",
"67adae0834d0560c": "Bridge10",
"92a4d68b4ba68204": "Bridge11",
"2b16be66afeb4027": "Bridge12",
"2a12bf769df9156d": "Bridge13",
"bd687b11bfbd17a8": "Bridge14",
"df848b4e364c8221": "Bridge15",
"2cce765f60142d35": "Bridge16",
"514464347ae47e6e": "Bridge17",
"8580cea8afba9b79": "Bridge19",
"40e00e15992bc5d7": "Bridge2",
"6a677cad94bc25d1": "Bridge20",
"cfeb590f73d7a07c": "Bridge23",
"75c4f2fefc0b2c67": "Bridge24",
"e6d98d08247e63fd": "Bridge25",
"4af173b0ed8662db": "Bridge26",
"2df8c90737172bb2": "Bridge27",
"7fa2d4ec07aa7bac": "Bridge28",
"5daa0f4e88acf49e": "Bridge29",
"217da9a0a94620a5": "Bridge3",
"a97228d0276c6591": "Bridge30",
"60002ccc4de44d5d": "Bridge31",
"1a7dcc166195e9bb": "Bridge32",
"d60ad4adf958e19e": "Bridge33",
"053b62acfba7f655": "Bridge35",
"f46a4934aa5d60d2": "Bridge36",
"e335e3bf66ce666d": "Bridge37",
"c30406f8a8ec7f56": "Bridge38",
"0c2c6d70a872e165": "Bridge39",
"136f0dadf60ee4e3": "Bridge4",
"0c5be21833ad7716": "Bridge40",
"5442bc29a3058500": "Bridge42",
"dc7b8bcf4257a5ed": "Bridge43",
"e53be0c98a4167be": "Bridge44",
"e276e0ff217e85bd": "Bridge45",
"3b8329956c17761c": "Bridge46",
"9bc9bdfa70a4e26b": "Bridge48",
"c59ffd2fa0adcf50": "Bridge49",
"0b2decc0cc939466": "Bridge5",
"40fa9ef1abc3ddc0": "Bridge6",
"5c5484f7d7f9039e": "Bridge7",
"a7227bf19d610fe0": "Bridge8",
"0a68d6171983b44d": "Bridge9",
"28ce33e9f628b255": "BridgeConfig",
"2c96d2d0824723ae": "BridgeData",
"195632adc56a31be": "BridgeDeposit",
"84177a1413cce45d": "BridgedLockedFee",
"a588237e32cde310": "BridgedWithFee",
"22936cfff091402b": "BridgeLedgerState",
"125086c4b9ed9db8": "BridgeLockedFee",
"5514b89edf1a9419": "BridgeWithdraw",
"da247721e02b794b": "BridgeWithFee",
"b92be7761b31e355": "BSOL",
"2847225597b7e1ec": "BTC",
"248e13dd995c10ee": "BTC_EMA",
"2d9e9f5018ab8fcc": "BtoA",
"a6299bde53d738c4": "BubblegumEventType",
"0ed3578cdb72011e": "BucketMintLimit",
"401b6349398f80f6": "BucketName",
"1f9dd66b9f975ddd": "Buddy",
"e3d6ad7029d88e18": "BuddyGlobalReferrer",
"be7ba92e02e1d945": "BuddyIsFrozen",
"b27453d0e74b1a1b": "BuddyIsNotFrozen",
"08202138f8738db2": "BuddyIsNotPartOfTheTreasuryOwners",
"648efa09062ac948": "Buddylink",
"4bbdcc0dc9eece37": "BuddyShouldBeSoleOwner",
"059e0d852e335cb2": "BuddyType",
"e9bd4027da280f21": "BumpNotAvailable",
"227335fe15733e3c": "BumpNotFound",
"dc8f7ad92084a015": "Bumps",
"1885eff09f8c8da3": "Burn",
"9bbbf228fc4bdfd4": "BurnAmountExceeded",
"6ac8ad1ea6fc9476": "BurnAndClaimLog",
"d11bdd7c8a6fe02f": "BurnAndStakeLog",
"33d242e5b4115cdf": "BurnApproval",
"5aedc69caf549ded": "BurnArgsV0",
"76e98ce713564e6b": "BurnConsumableIngredientInput",
"95fb433019f2bb45": "BurnDelegate",
"b03bd36d98a025c6": "BurnDelegatedDataCreditsArgsV0",
"656669f1e0950d97": "Burning",
"6b77c2a1a1cfc3ef": "BurningPotAccount",
"ffd128711d76ef9a": "BurnTooEarly",
"3210d128e1d48d6a": "BurnWithoutTrackingArgsV0",
"7210807e3a57502e": "Buy",
"cf90f92cbd30d857": "BUY",
"6ffb29eb5f1f6497": "BuyerATACannotHaveDelegate",
"c8a499bb763cc833": "BuyerTradeState",
"c3372e293607e19b": "BuyerTradeStateV2",
"e16424902ef30861": "BuyLimit",
"2510d664e5fb1424": "BuyState",
"d3bdc396c6b307d5": "BuyStateIsBeingClaimed",
"b08705d43018f31a": "BYOD",
"a07a6548b2028f8c": "BypassBorrowLimit",
"a029a550ff65f9e3": "BypassDepositLimit",
"adc24c5b6590c761": "Bytes32",
"f8ae9dc78d50b435": "C",
"cd11aad56ab36ba1": "CalculateUtilityScoreArgsV0",
"0380ca0d6c2c029a": "CalculationArithmeticException",
"92ce4f1f8f565537": "CalculationFailure",
"c6c3ccac05251cff": "CallbackAccount",
"6dea49532f4d9edd": "CallbackAccountType",
"15ddc7f18f6dd80f": "CallbackAuthority",
"a6a85c5236b756b6": "CallbackInfo",
"7c450de95cc2a199": "CanActivateOnlyInitializedBond",
"c275d003dc31a2d0": "CanAddCollateralOnlyToInitializedFBond",
"39638e0ba4799401": "CanAddWhitelistOnlyToInitializingMarket",
"91f643353c2cc5d9": "CanBurnEntireSupplyOnlyForActiveBond",
"70221aefbef2bbbf": "Cancel",
"247999bf973ac397": "CancelationLowLiquidity",
"3543857f400d2ed2": "CancelationMarketNotInplay",
"8642392f28739871": "CancelationMarketNotLocked",
"833b18bedfb6d6fe": "CancelationMarketOrderBehaviourInvalid",
"125250ba332d5af0": "CancelationMarketStatusInvalid",
"d3c6cb89543b4a0f": "CancelationOrderCreatedAfterMarketEventStarted",
"c015467ccd9d9c30": "CancelationOrderStatusInvalid",
"57e1c6237dc3b8d4": "CancelationPreplayOrderRequestsExist",
"067f8c0a44abbca6": "CancelAuthority",
"9c2d8f3ee6e14e47": "Canceled",
"09ab1a67c6af967a": "CancelIsAutoReinvesting",
"ab717904d922acf9": "Cancelled",
"88b6d7f68f2c4e81": "CANCELLED",
"73bd99950612d366": "CancelledAtIsZero",
"6c5d81ae94a46dca": "CancelLimitOrderLog",
"2a135569d4fbec38": "CancelOrderByResolverIsForbidden",
"5fa73965362719cb": "CancelOrderNotCancellable",
"744648095aec5dbf": "CancelProvide",
"37211c3e39ea0208": "CancelTriggerOrderLog",
"07b7bb8d3e821847": "CancelUnmatched",
"5c57373aab9699df": "CancelUnstakeSucceed",
"518bb16c45f2e3b9": "CancelUnstakeTokenRequestLog",
"d1ad388e16e74184": "CancelWithdrawRequest",
"9553d20da44d8540": "CanCloseVirtualPoolOnlyIfNoLiquidityLeft",
"2ccfc7b8706722b5": "CandyGuard",
"0b6b2933a6c68dcb": "CandyGuardData",
"33adb17119f16dbd": "CandyMachine",
"086e165b2f863611": "CandyMachineData",
"ac0a6cef98ad84e5": "CandyMachineEmpty",
"7f32a20125478ce7": "CandyMachineNotLiveYet",
"2a30ce5d2c8d7779": "CandyTap",
"cad2501a90d09967": "Capital",
"6bf12bd5862cf87b": "CapReached",
"a6fa2ee6983f8cb6": "Card",
"0d47e3caaf36e760": "CardBot",
"773668e18bab42d3": "CardBotPurchase",
"c3554f313464fd5a": "CardCustodyData",
"675dfb4990b28e7d": "Cargo",
"74c28e793c3a9519": "CargoAmountAboveZero",
"a52176ebfcbcf45d": "CargoPod",
"43e2bba2570c178b": "CargoStats",
"3c8885918111836d": "CargoStatsDefinition",
"e2c6f69cacd18d06": "CargoStatsUnpacked",
"fcab153dc6556250": "CargoToGameInput",
"9866bce6c80ea4e0": "CargoType",
"583f69e66cb5e22a": "CarrierNotApproved",
"911e92d98146c884": "CarrierV0",
"0695da621c20444b": "CashBased",
"2091e69633ae60b3": "CashBasedLiquidationDecision",
"f2be834b40aa68aa": "CastingFailure",
"c396149bc9f317ed": "CastVote",
"7f3dad7b8a483ad5": "Cbrs",
"9c4ada8000ded1d5": "CbrsInfoV0",
"550745053c9846d8": "CBTC",
"c24f8e5cb8fb1e22": "CBTC_BTC",
"e7560abfc74a3df7": "Cctp",
"3a3ae6551aa8c834": "Ceiling",
"816212bfe75cc802": "CETH",
"93712e86ac350005": "CETH_ETH",
"eff59bd1c16be7dd": "CFTT",
"313c4d1ca202f34e": "CFTT_FTT",
"f96151ef6cd02d1b": "Chain",
"cb92c9a1e6479dda": "ChainId",
"06d4905da78bb001": "ChainIdNotEvmSupported",
"b1f2c17f0af1ea51": "ChainIdSolanaOnly",
"0ca6e89d4e1aa025": "Chainlink",
"9fb1e06d84a10214": "ChangeAuthorityData",
"af3cc993677fa3ce": "ChangeDelegatedSubDaoArgsV0",
"2a77921e180cac7b": "ChangeKind",
"338539b6265831f8": "ChangeLocked",
"d0930dde364c2d10": "ChangeLog",
"2d5a4d97457b1ca4": "ChangeLogEventV1",
"ba891fdf21f84ef2": "ChangeStorePriceInput",
"3dfc3fec3f7c9bfa": "ChangeStorePriceInputUnpacked",
"f8788bb3c514bd47": "ChangeThreshold",
"57979b8499853473": "ChaosLabsBatchPrices",
"a3db8594814fd1c3": "CheckpointData",
"3e69e560f84890a2": "Chest",
"3a9bd41b98a2961e": "ChestLowBalance",
"dc8801dd86b2295c": "Choice",
"d2bd757d681eb849": "ChoicePercentage",
"25c82468925fb037": "ChoicePercentageOfCurrent",
"dbb392c3199618f4": "ChoiceVoteWeight",
"ee0459ea6924a346": "CIDLengthTooLong",
"b152d152830b9924": "CircBuf",
"8febb04c839c1426": "CircBufCluster",
"fa53bd05e4f02ed5": "CircuitBreakerTriggered",
"4d1a8d7bf1601014": "Cirque",
"9b4616b07bd7f666": "Claim",
"89e926ef2369851d": "CLAIM_PROTOCOL_FEE_OPERATOR",
"0486d7ea63f2e049": "CLAIMABLE_ACCOUNT_SEED",
"59d32079b2d2a47c": "ClaimableCollateral",
"72b0858286f43451": "ClaimableCollateralForHoldingCannotBeInOutputTokens",
"db63bbce63605439": "ClaimableFee",
"3544ddbf828e7431": "ClaimableFundingAmountPerSizeForLong",
"c19f0da761311820": "ClaimableFundingAmountPerSizeForShort",
"d7280a0a88ad3da6": "ClaimAmountExceedsMaxTotalClaim",
"446ca091af22f4ee": "ClaimApproval",
"22263b2c7fe7b0c0": "ClaimApprovalNotFound",
"43ee1b8a5d34794e": "ClaimCountExceedsMaxMerkleNodes",
"9d3467be8d0d7352": "ClaimCursor",
"49d8e22282ba12d4": "ClaimDisabled",
"fcd61f710f04da19": "Claimed",
"0f0ec49af968c9e2": "CLAIMED",
"871c6a57b6b71230": "ClaimFee",
"a630865622c8bc96": "ClaimFeeOperator",
"4b53f26a2ecda9bd": "ClaimFeeSucceed",
"434fbea55a3525f5": "ClaimingIsNotFinished",
"d62c7fe1d877904b": "ClaimingIsNotStarted",
"5bc0b7733f0566aa": "ClaimIsClosed",
"abc8bc5989b16a4b": "ClaimMoreThanCommit",
"d0dd155e2b5761bb": "ClaimMoreThanSupply",
"c09fcc13e9911f88": "ClaimNonConsumableIngredientInput",
"080c4548f1c9528f": "ClaimNotAvailable",
"edab0c07063c5061": "ClaimNotStart",
"ab52f5d8e800d28e": "ClaimPortionConfig",
"52e34d9e9ae6e51f": "ClaimRecipeOutputInput",
"e09395d8c9951bfc": "ClaimReward",
"c50c13c8ebd6074d": "ClaimRewardsArgsV0",
"ac4001d9d3038450": "ClaimsAreNotClosable",
"24f436257697916c": "ClaimSettlementProofFailed",
"30ee569776d2b503": "ClaimsLimitReached",
"dee052efb6fd74cb": "ClaimStakeVar",
"cffbc00ca36042bc": "ClaimStaking",
"16b7f99df75f9660": "ClaimStatus",
"4f702df605c03165": "ClaimTokens",
"463269d53b354869": "ClaimTokensInput",
"cb9733d4039e9c43": "ClaimTooEarly",
"0c6945b7cb96546c": "ClaimType",
"9862692acef66bf5": "ClaimUnrestakedVST",
"613788d2d3987928": "ClaimUnrestakedVSTCommand",
"d130cf712f051b9a": "ClaimUnrestakedVSTCommandItem",
"0521d1bb42bc9465": "ClaimUnrestakedVSTCommandResult",
"c3014962f4a00811": "ClaimUnrestakedVSTCommandResultAssetReceivable",
"a928a1383f835c46": "ClaimUnrestakedVSTCommandState",
"db1f5526b3b75597": "ClaimUnstakedSOL",
"b8c28862d2c74fc3": "ClaimUnstakedSOLCommand",
"b700aee40ff90306": "ClaimUnstakedSOLCommandResult",
"986cfd74f8c845b2": "ClaimUnstakedSOLCommandResultAssetReceivable",
"4e6e3fa5e1ad2526": "ClaimUnstakedSOLCommandState",
"641b6ba01df8c877": "ClassicAuthority",
"74b900b67bcacdf0": "ClassicAuthorityWorksIfValidationProgramIsHadeswap",
"28a87b4b74edb4e8": "ClassicValidation",
"b447314fb40a3581": "ClassicValidationWhitelist",
"780004736a70d945": "ClawbackBeforeStart",
"d482385b2cf562ad": "ClawbackDuringVesting",
"c5e9c3a2d372d2aa": "ClawbackReceiverIsTokenVault",
"240a2cf6a1a8a2e8": "Clear",
"858438951c46d874": "ClearLiquidationGainsBlocked",
"27a1303635971e6b": "ClearpoolsSwap",
"225d24abbeae371b": "ClearpoolsSwapOptions",
"f753957ace84686a": "ClearRedemptionOrderBlocked",
"0212ac239d3161ee": "ClendAccount",
"1dd775ac55cd714d": "ClendGroup",
"20b8c094e174bc35": "ClendSupply",
"140cde11fc51456d": "ClientVersion",
"c256a96369df5c2a": "Cliff",
"6b2ac4932cb8369a": "ClockData",
"5bbe9ee356ee8a7d": "Clocks",
"2c04aa3566b972ef": "ClockUnavailable",
"14f3577902ca8282": "Clone",
"333b7aed1ac4845b": "Close",
"1f75ef7c58fb1ccd": "CloseAccountMarketMatchingQueueNotEmpty",
"80db38801f162e07": "CloseAccountMarketPaymentQueueNotEmpty",
"b82a77ebe0809517": "CloseAccountMarketPositionNotPaid",
"e87e9e4b91396286": "CloseAccountOrderNotComplete",
"8f60c75364ea5f9a": "CloseAccountOrderRequestQueueNotEmpty",
"9cac2964a9ca6dc4": "CloseAndSwap",
"077e74637497b66f": "CloseAndSwapLog",
"2428d067d8c93dad": "CloseConfig",
"fd482d7c4ae4a89d": "Closed",
"10a1626bf3185d9f": "CLOSED",
"27a5a6a1cb985a31": "ClosedByLimitOrder",
"c3aec9e82fefeaa4": "CloseDisbandedFleetInput",
"131940794958b0b0": "ClosedStake",
"9c41e484c6d7a091": "CloseEpochNotReached",
"47223a9d6a11fe76": "CloseNonZeroPosition",
"ae6e2337cf1ddf47": "CloseOnlyMode",
"7c1c894a779509ed": "CloseOrderNotAuthorized",
"9b73bbac2ea14e18": "ClosePosition",
"c3fbeb4939271736": "ClosePositionErr",
"9d15a468ed4b832e": "ClosePositionLog",
"30a1fe43d747f5e9": "ClosePositionLogV2",
"0c732d4cd7030a81": "ClosePositionLogV3",
"95619d6f72f58918": "ClosePositionNotEmpty",
"863b24323ed62257": "ClosePositionWithZero",
"d509520b985588b2": "CloseQuoteData",
"907145c5bd6244df": "CloseRatio",
"72604940191133cd": "CloseSubAccount",
"b6b75b874a5cbb8f": "Clubs",
"299af150875855fc": "ClusterHistory",
"ee28b9f18ebb4e8a": "ClusterHistoryEntry",
"fd964835b8af4002": "ClusterHistoryNotRecentEnough",
"b1ef028fc951c9a5": "CMSOL",
"1c3e20bc0056c435": "CMSOL_MSOL",
"2bc3aa381ae5997f": "CMSOL_SOL",
"75c55490dd9730bc": "CodeVersion",
"37c0b9fd10d27505": "CoefBOutofBounds",
"f9bcb2695bfa5ed7": "CoefficientZero",
"5b017e28c938ee17": "CoinFlip",
"c7422a6bc0809601": "CoinFlipMultiplier",
"7b82ea3ffff0ff5c": "Collateral",
"6d70649e6d2cefbc": "COLLATERAL_DECIMALS_LIST",
"39adf215d3773fef": "COLLATERAL_LIST",
"52849e83f4f33925": "COLLATERAL_ORACLE_LIST",
"4bb01999ef9b3e24": "CollateralAction",
"d5248b999b537250": "CollateralAmounts",
"6f6fd4eb496c2c85": "CollateralBox",
"e1b81bf034e3137f": "CollateralBoxType",
"7041564fa5b56da9": "CollateralDepositExceedsCap",
"5cbc67e18f075211": "CollateralDetail",
"b30f0f9aff2ce5df": "CollateralExchange",
"7c58aa9a64f9d1a4": "CollateralId",
"a3445225dcb21299": "CollateralInfo",
"7fd234e24aa96f09": "CollateralInfos",
"608833b3c6270999": "CollateralNonLiquidatable",
"1529959490e85ba4": "CollateralNotEnabled",
"e03be3b2ab2147d6": "CollateralShouldNotBeUsed",
"c40b42adab1b7a2e": "CollateralSlippage",
"f1434d551ed9d69e": "CollateralStatus",
"7c4526081fe18817": "CollateralSumForLong",
"304fb6cc08e29c57": "CollateralSumForShort",
"4ed507930359a0b7": "CollateralTestToken",
"410f3fe89bbe878e": "CollateralToken",
"2e1c9dd0c405214e": "CollateralTokenActive",
"6ff8d2aeabcda270": "CollateralTokensExceedDepositCap",
"f10932b9555b81dc": "CollateralTokensExceedDepositCapPerIxn",
"d9b71bf9387c4bb2": "CollateralToPnlToken",
"13bd5f9b64099f91": "CollateralVault",
"1ca99a4511367f20": "CollateralWithdrawalCaps",
"23c4a87cc99c2610": "Collect",
"b942a2af52367d5b": "CollectAirdropReward",
"42397881e9d623c5": "CollectConsumptionRewards",
"310372aa52ede462": "CollectDeveloperRewards",
"4e89535bb4d3f37d": "CollectedFee",
"80bc3821eb1112e9": "CollectFeesBlocked",
"30a0e8cdbfcf1a8d": "Collection",
"e0a5ac8067c6e595": "CollectionCannotBeVerifiedInThisInstruction",
"df6e98a0ae9d6aff": "CollectionConfig",
"c3b71e6bd1610fa3": "CollectionId",
"c2504e8ac7dae691": "CollectionMasterEditionAccountInvalid",
"5906e954869e00cd": "CollectionMustBeAUniqueMasterEdition",
"77fd347428922a35": "CollectionMustBeSized",
"b2bde4047f3fa76c": "CollectionNameTooLong",
"c0738a9a9cec03d2": "CollectionNotFound",
"ce4017516ba67b3e": "CollectionNotInitialized",
"f1e9caaec3d4e560": "CollectionV1",
"ec34f33efd71a300": "CollectReferralReward",
"b61047486858a418": "CollectRevenueLog",
"b69e924f731b69e3": "CollectRewardsBlocked",
"04084319d00f9f65": "CollectStakeReward",
"c6f8d81b5f65bbb1": "CollectStakeRewardLog",
"d4825cc00e02b5e3": "CollectStakeRewardLogV2",
"559b8ee0691665a4": "CollectTokenRewardLog",
"ffdb2bf72dd29688": "Column",
"9a815fef0fcefc46": "Commander",
"5df11556a3f22fdd": "CommentProposal",
"de9e66763341a682": "Commit",
"54677010e56e28b0": "CommitBin",
"aac38e9f1d58e8ca": "CommitCapExceeded",
"b5caabe37f7fa4bd": "CommitDisabled",
"a6c6f803df35cea3": "CommitInput",
"3d70818018934d57": "Commitment",
"ea66e4ba39e8b833": "CommitNotEnd",
"2ee7f7e7ae44221a": "CommitReport",
"ec96ca1eb16de54b": "CommitReportAccepted",
"8e79aed0d58144fd": "CommitReportHasPendingMessages",
"d1ac170bfc698283": "CommitReportPDAClosed",
"19c20d711ffe1d0e": "CommitStatus",
"ad1866389eae33e4": "CommonFields",
"f82b199e9307d32f": "CompactResult",
"772933bb954bda6f": "CompiledInstruction",
"af5de8cd2b2ae40a": "CompiledInstructionV0",
"0595d2ebf0e2e935": "CompiledTransactionV0",
"fe6f6a918528430a": "CompiledV0",
"ad49652c62b4e8e8": "Complete",
"3ef7fad36a705db2": "Completed",
"376b4ffef316acf0": "ComposeMessageState",
"3bce566f0e11a34b": "ComposeNotFound",
"0f6b476893a8b361": "CompositionFactorFlawed",
"6370dcfd30bd502c": "CompositionFee",
"7d6d5ef067a61570": "CompoundingFeesLog",
"2ba0048549838d3a": "CompoundingStats",
"055dddbf7b292178": "CompoundingTokenData",
"f67e9205e1cf8163": "CompressedAccount",
"269ac6c35a47d326": "CompressedAccountData",
"5c792a2839e5527e": "CompressedBinDepositAmount",
"5dc6ad5efd78a892": "CompressedBinDepositAmount2",
"3544a183d46a6230": "CompressedClaimStatus",
"c921d99c468c2566": "CompressedCpiContext",
"d052d40c3a52f6c0": "CompressedPdaUndefinedForCompress",
"53f13475d87fdddf": "CompressedPdaUndefinedForDecompress",
"5a059ed19b976a1d": "CompressedProof",
"e6f51db3f96a3731": "CompressedSolPdaUndefinedForCompressSol",
"fe73e2c978f0914f": "CompressedSolPdaUndefinedForDecompressSol",
"4fb13e9131d764ab": "CompressedTokenInstructionDataTransfer",
"26bcd4d761912310": "CompressionAccountType",
"7d843aec3d735c70": "ComputeCompressSumFailed",
"57aa886b57e60772": "ComputeDecompressSumFailed",
"da53b1974349ff34": "ComputeDelegations",
"d141739b6ac5573d": "ComputeFeesAndRewardsInvalidReward",
"2182ff99f8bb759c": "ComputeInputSumFailed",
"512c8b84786018c6": "ComputeInstantUnstake",
"a8f5fb340781c40b": "ComputeOutputSumFailed",
"63b6b3d4f219b643": "ComputeRpcSumFailed",
"74a45a0cdf66d03c": "ComputeScores",
"6c4229616091073b": "ConcurrentMerkleTree",
"3c67ff542fed5310": "ConcurrentMerkleTreeHeader",
"d0a64396f331f588": "ConcurrentMerkleTreeHeaderData",
"e4e5eeecafc2e69d": "ConcurrentMerkleTreeHeaderDataV1",
"78d1f95b964efab5": "ConcurrentProcessCountNotZero",
"8ae24acc6817873f": "Condition",
"dedc1686d8b07d29": "Conf",
"c7b4c61183055424": "CONF_SEED",
"64cd2a4ebf4cb03a": "ConfidenceIntervalCheckFailed",
"9b0caae01efacc82": "Config",
"74bd1295b974acb5": "CONFIG_SEED",
"bdff6146babd1866": "ConfigAccount",
"7ed76dafa7a4f9d7": "ConfigAction",
"60f1dc2feaa24126": "ConfigActivated",
"8094c07ba34fe014": "ConfigClosed",
"6b900084d01896d1": "ConfigCreated",
"f87ec33bf3da9977": "ConfigDeactivated",
"92738bb682ae920d": "ConfigFieldMissing",
"77a24dca3f89f2a0": "ConfigLine",
"fcfd66c74e50d5a0": "ConfigLineInput",
"c4e159b919c1f7a0": "ConfigLineSettings",
"b749154f8c2d5f50": "ConfigMustHaveAtleastOneEntry",
"73c133c0881baec8": "ConfigNotInitialized",
"3663404136116bdf": "ConfigOcrPluginType",
"5fc08a3cff8ea812": "ConfigParameters",
"267934efe4db48cd": "ConfigRemoved",
"8742f0a65ec6bb24": "ConfigRouter",
"79d14ac1db33874a": "ConfigSet",
"1934f6e7e06dad64": "ConfigSettings",
"0fb97c3006b7b677": "ConfigSettingsV0",
"5e080423718b8b70": "ConfigTransaction",
"c04fac1e15ad192b": "Configuration",
"ce3932087c858a70": "Confirmations",
"6abbed972bf9a937": "Confirmed",
"dc69024676047f34": "Constant",
"800dae1793b58902": "ConstantCurve",
"81e1c1b7189ff582": "ConstantProduct",
"4371f9dd83e4bd31": "ConstantProductInvariantFailed",
"d4db56cfc7f364e0": "ConstantProductV1",
"96938f93fe17735b": "Continent",
"c58b32d12b9df330": "Continuous",
"2485f0b5cf69a652": "ContractClosed",
"be8a0adfbd74de73": "ContractState",
"c8762f1cf8ad1a0e": "ContractTier",
"6c05378130c1632d": "ContractType",
"5fb51d49155d2b70": "ContributeToRedemptionInput",
"887cba57657b0675": "ControlVariable",
"abbb7a1dcbf79d3d": "ConversionFailure",
"3690d568e6e3199e": "ConversionRateOutOfRange",
"e302b7c964003873": "CooperatorConf",
"57fd1fa1cff9989f": "CORCA",
"c7fa9849da801ce8": "CORCA_ORCA",
"5aa7639ac0e30d3e": "Core",
"e8440e06f2b96987": "CoreContributor",
"34fafc0267f14bf4": "CorruptSignature",
"8f78c08ed12a9fc0": "Cortex",
"d762dc345fa1843a": "CortexInitializationStep",
"74c798ec5a9cb600": "Count",
"3bfdef08125713a1": "Cpi",
"1876c69bcf8cb6fb": "CPI_AUTHORITY_PDA_SEED",
"161495da4acc80a6": "CpiContextAccount",
"4f2f39d402432744": "CpiContextAccountInvalidDataLen",
"5b7372d952e66510": "CpiContextAccountMissing",
"639cf7343a231c65": "CpiContextAccountUndefined",
"2061ea24945eeb07": "CpiContextEmpty",
"1d20472bb9a1769a": "CpiContextMissing",
"6cc89c50936e9540": "CpiDisabled",
"f5e373471b062db4": "CpiSignerCheckFailed",
"7cf63808685ff9fb": "CraftableItem",
"66cc3837da9438f8": "Crafting",
"3a4923115cf7311e": "CraftingFacility",
"5aba9bd05dba70bf": "CraftingInstance",
"52f8a96707291767": "CraftingInstanceType",
"69b80569af700da9": "CraftingProcess",
"31f0011df4f58e67": "CraftingProcessNotCompleted",
"a9b137caee14aa86": "CraftingProcessNotStarted",
"8024f9eb54d2aca6": "Crank",
"2769b81ef8e7b085": "CrankFeeWhitelist",
"bac0b94d277d512c": "CrankFeeWhitelistClosed",
"87087d6ae18aa5e6": "CrankFeeWhitelistCreated",
"9987a19833e43b60": "CrankFundFeePerReserve",
"e8cd52b670506dbe": "CrashMulti",
"8a461efe6af10a0f": "CRAY",
"bbcb5fc0b3f9fa26": "CRAY_RAY",
"f1d1c2199043fc6a": "CreateConfig",
"d5d2f802fdd4882a": "CreateCraftingProcessInput",
"9e60449b2b4ca11b": "CREATED",
"122e1e2452265690": "CreateFleetInput",
"f027b7f423f63fb5": "CreateGovernance",
"80b9dfbbe3fc16cd": "CreateLockEscrow",
"f10960f0c98d5d83": "CreateOrder",
"23d3930e80bd0d26": "CreatePartnerMetadataParameters",
"c1466f19e9c40a95": "CreatePeriod",
"31e044008d28fefb": "CreatePointCategoryInput",
"15c5c3a5875da142": "CreatePointsStoreInput",
"9d5242aaba83c4b7": "CreatePointsStoreInputUnpacked",
"6eb099267d9b7bed": "CreatePositionWithZero",
"b0c3f8ebcb41214f": "CreateProposal",
"7d35d85bc437aa63": "CreateRedemptionConfigInput",
"16fd9c45693ba406": "CreateReward",
"3c8b6f237bf81259": "CreateRootEscrowParameters",
"54f6b91449216861": "CreateRound",
"e5462df5f8abde83": "CreateStablePoolData",
"dc8da5a4decfb06c": "CreateTeam",
"5142252b58df37b9": "CreateTrackArgsV0",
"2613dc5631679529": "CreateTrackConfigArgsV0",
"7b254b7adc14996d": "CreateVestingEscrowMetadataParameters",
"76b7971891b8cb1f": "CreateVestingEscrowParameters",
"cd18c609286f4f24": "CreateVirtualPoolMetadataParameters",
"296fbff5b9f66a58": "CreatingNewOrdersBlocked",
"9863a3270a21a4be": "CreationInvalidPrice",
"79193e01322f8ae7": "CreationInvalidPriceLadder",
"7b4aa7ce70173b15": "CreationMarketHasWinningOutcome",
"980891fb79124513": "CreationMarketLocked",
"e1aa15da7acd76e6": "CreationMarketNotOpen",
"c5bb057674d80412": "CreationMarketSuspended",
"40c5c461bd669cfb": "CreationPriceOneOrLess",
"733ba6b99d5c1abb": "CreationStakePrecisionIsTooHigh",
"c811eac0d339cd1c": "CreationStakeZeroOrLess",
"b78e7b4c257bd995": "CreationStatus",
"ed25e999a5843667": "Creator",
"5977d0b683f660bd": "CreatorAddressInvalid",
"fa23188a707113d3": "CreatorDidNotUnverify",
"3d6ae3a7a126c0f5": "CreatorDidNotVerify",
"e8e1851cfcdf4825": "CreatorFeeTooHigh",
"f4d932ec3c84e7f5": "CreatorIsNotProvided",
"a4f3d580e91b7d3e": "CreatorNotFound",
"9c36909f5eff9c48": "CreatorShareInvalid",
"b9448f12202d9b1e": "CreatorShareTotalMustBe100",
"24fec1c5f43fcbde": "CreatorsTooLong",
"f022440ea93a8af9": "CreatorWithShare",
"d62b9cd857f3d797": "CREDIT_TOKEN_MINT_ADDRESS",
"91d9b1907f1c5f29": "CreditsInfo",
"c73395bfb201b880": "Crema",
"fe32627ca6f1c4ae": "CrewConfig",
"4db41fa6d030717c": "CrewCreator",
"db71723bb8a47679": "CrewCreatorUnpacked",
"8d864027a0371214": "CrewTransferInput",
"e31de72e34e6c2b7": "Cron",
"6024bd946cbc8db8": "CronJobHasTransactions",
"50a12d87145012ea": "CronJobNameMappingV0",
"6c79e6d8b828bdc0": "CronJobNotRemovedFromQueue",
"75ff395eb4e57127": "CronJobTransactionV0",
"45a1bd17fa3b439d": "CronJobV0",
"62871b5066d40aab": "Cropper",
"57d37eb097cdabeb": "Cross",
"4c9994f2cf28ea18": "CrossChainAmount",
"6de63eac59e9bb5c": "CSLND",
"1c80aa0dd897f886": "CSLND_SLND",
"26051e4fe1efe592": "CSOL",
"68e954ada42f851d": "CSOL_SOL",
"4f6a26f4606ffc0d": "CSRM",
"9eb2b83360f71be9": "CSRM_SRM",
"b8b26b9b2a9b322c": "CSTSOL",
"ebaba527da1b8ec1": "CSTSOL_STSOL",
"81653cc086506da6": "CToken",
"bf3e74dba343e5c8": "Currency",
"0241c53791f9a22e": "CurrencyNotYetEnabled",
"c915604c4c03c8b4": "CurrencyNotYetWhitelisted",
"4665c577262274ac": "CURRENT_POOL_VERSION",
"1bf60e234fb1b2ab": "CURRENT_TCOMP_VERSION",
"ef9f53dbb352c85b": "CURRENT_TSWAP_VERSION",
"89980e8de39356e1": "CurrentResult",
"5b6af031ee61db30": "CurrentStakeAccountShouldBeUndelegated",
"df79442708ecd8e1": "CurrentTick",
"811c313a4aed92ca": "Curses",
"54484133aa1b2aaa": "CurseSubject",
"bfb4f942b44733b6": "Curve",
"085b531c84d8f816": "CurveAccount",
"7f4389d5b552712d": "CurveBalanced",
"91b70de126974ee9": "CurveDataV1",
"3da701b47312754c": "CurveImBalanced",
"ebaf15a45b3c2830": "CurveLimit",
"d98b25ffaf09bad7": "CurveNotCompleted",
"a3e75ad6e6f74f9b": "CurveOneSide",
"4f2795c4be68c540": "CurvePoint",
"d8659b1123991de2": "CurveRecord",
"a74183d70db74910": "CurveTimeLockedOrMigrated",
"2896fa2fb4aefafd": "CurveType",
"b4892a02a4017277": "CUSDC",
"9ff0660dfe6b1799": "CUSDC_USDC",
"01b830515d833f91": "Custody",
"18d4ff988532aa06": "CustodyAmountLimit",
"e2bb24f37ebf08fe": "CustodyBelowMinimum",
"f0ea721194c507ae": "CustodyDetails",
"e6ee95c0a9bb9697": "CustodyInfoSnapshot",
"8b93440b46ad80fb": "CustodyNotFound",
"7118f1f0a67e2aba": "CustodyStableLockedAmountNotFound",
"d9a62c09927a83c3": "Custom",
"203b29e514af196e": "CustomAuthority",
"454b4dbbb83311b6": "CustomDestination",
"7feb6a44ee8579bb": "CustomFeeMap",
"40b5b00de0604b93": "CustomizablePermissionless",
"e3aaa4da7f1023df": "CustomOracle",
"227376c270c3da9a": "CustomPartial",
"3fcd50e9114670af": "CustomValidation",
"bd6ec53b6700f173": "Cycle",
"402955aaeaab4505": "CYCLE_DURATION",
"b9699369962b93b7": "CYCLE_LAMBDA",
"723356aac62e49f9": "CYCLE_SEED",
"257eee6bed75e54c": "CYCLE_SUPPLY",
"34aade3e1bd30134": "CycleGenesisTimeMustBeFuture",
"6ed1ff830bc579b8": "CycleGenesisTimeTooFar",
"29b02cd690280f94": "CycleNotElapsed",
"c01b2967fb469a56": "CycleNotGenesis",
"125b9503759953f4": "CycleSupplyReached",
"58f6bcc6817a9b1e": "Cykura",
"37ec98eb12cd7ebf": "DAI",
"26dd5e1745173f95": "DAI_EMA",
"4e144dcf63678494": "Daily",
"dbb35d75f350130c": "DailyBuyLimitExceeded",
"ea769f69b1a33c44": "DailyIssuanceTooEarly",
"53dba3e70e211e01": "DailyWithdrawLimit",
"ee82d6f9e3f12da8": "DampingTermTooLow",
"0ba88ac49b937a2c": "DaoEpochInfoV0",
"fc9b0f8da07bbb0d": "DaosFunBuy",
"3528a0688221737e": "DaosFunSell",
"019d8fa78bfd6aaf": "DAOSOL",
"bceb83eb98fc4126": "DaoSOL_SOL",
"654be88def2d1dcd": "DaoV0",
"7455299e2c34a727": "Dark",
"55f0b69e4c0712e9": "DataAccount",
"eb356d23b81e51d5": "Database",
"aba2be6036d6d6a2": "DataCreditsV0",
"d4b522c865941608": "DataFieldUndefined",
"6e57aba778379053": "DataIncrementLimitExceeded",
"1e7a3809426a3fbc": "DataOnlyConfigV0",
"d46b495424664cac": "DatedPrice",
"8485b0e6cd931533": "Day",
"141ba66e740c23c8": "DC_ID",
"525d5a7f2865919a": "Dca",
"82186aeffe008593": "Deactivated",
"7fb9491b52fb97e9": "DeadlineIsNotPassed",
"420e3f706c887066": "DeadlineIsPassed",
"375fe1f50c87f2f0": "DeadlinePassed",
"10da4cc3f34f90e2": "Debridgedln",
"099e77c09bef9fb8": "Debt",
"d66d4b251b15f0c0": "Debugger",
"8ff7ae99ecac0980": "DebuggingOnly",
"5757d00d316bb696": "DebugInstruction",
"7e68e567031e11d5": "Decasecond",
"6aaff4b2623bfa86": "DecimalNegativeSqrtRoot",
"713f2a4f24797ed0": "DecimalOperationFailed",
"fdc203b48a5e07bb": "Decimals",
"adffe06d94429ee7": "DecimalToU128ConversionFailed",
"d66c9df158e9ad4b": "DecimalToU64ConversionFailed",
"47073a1c20516e0d": "DeclaredLossTooHigh",
"2f5bdfc73e5c2afb": "DeCompressAmountUndefinedForCompress",
"141b1642717e5eee": "DeCompressAmountUndefinedForDecompress",
"27f71eddf126dabd": "DecompressibleState",
"416b5971a0b103cc": "DecompressionDisabled",
"203de9ad18fc698b": "DecompressionRecipientDefined",
"3284571fc571d79d": "DeCompressLamportsUndefinedForCompressSol",
"ac039e4ba5683cf8": "DeCompressLamportsUndefinedForDecompressSol",
"efc77b14bc5c2caf": "DecompressRecipientUndefinedForDecompress",
"b0f5f4440898a027": "DecompressRecipientUndefinedForDecompressSol",
"e857bfbe89ded368": "Decrease",
"9bb7f158f823bc3c": "DecreaseAndRemoveCollateral",
"1d95de0b1671004a": "DecreaseComponents",
"8b703c0c046e0677": "Decreased",
"24ce9a3dd26da93b": "DecreasePositionLength",
"e7d9943eb4936d86": "DecreasePositionReport",
"a48bf3a5be9a5445": "DecreasePositionSwapType",
"745fdaaaa2f476fe": "DecreaseSize",
"d3890c19d8800ac5": "DecreaseSizeLog",
"f558eca2a56cf3bd": "DecreaseSizeLogV2",
"bccb8f35f57d1a16": "DecreaseSizeLogV3",
"340a1ecb42a0a602": "Decreasing",
"d61625b99cdcff72": "DecrementLevelInput",
"391fa6bf036a8396": "DecrementTake",
"d29bf4673b076b63": "DecrementTooLarge",
"cd4c73d584aa7986": "Default",
"d3df934c9e3b396e": "DefaultAdminSetup",
"c341fa6962b28ef8": "Defaulted",
"2a197937bd39becc": "DefaultFee",
"d289826866777d3b": "DefaultGasLimitExceedsMaximum",
"4f564f93602b4161": "DefaultMultiplierBps",
"22fa2071ce64ecbe": "DelayedUnstakeFeeIsTooHigh",
"5c91a66f0b2626f7": "Delegate",
"fc435843b796fb24": "DelegateBuilderFailed",
"bdd02975cf13cfbd": "DelegateChanged",
"2bcf2f8518228e2f": "DelegateCollateralAllowActiveOnly",
"399d0b4942da1c19": "Delegated",
"f8a5b7df029e1143": "DelegatedAmountIsNotZero",
"5bc39d1e97225084": "DelegateDataCreditsArgsV0",
"3e9965d17d74c5d3": "DelegatedDataCreditsV0",
"ceaa72ef8a7ca914": "DelegatedInstanceAccountNotEmpty",
"fbd420646601f751": "DelegatedPositionV0",
"2b94a113cd221838": "DelegatedTransfer",
"44c8eddf3d4da74e": "DelegateNotAvailableForLiquidation",
"a63ccafe7b45aa57": "DelegateSignerCheckFailed",
"bd37a4545e447d68": "DelegateVotesChanged",
"50a06d09523a3908": "DelegateVST",
"f3ad4731007ccf3e": "DelegateVSTCommand",
"2064a27888675ac7": "DelegateVSTCommandItem",
"2c208024733088ab": "DelegateVSTCommandResult",
"2e3a78a61a9caafd": "DelegateVSTCommandResultDelegated",
"c9bdf23e1006eca9": "DelegateVSTCommandState",
"ed5a8c9f7cfff350": "Delegation",
"690c2006a1086af4": "DelegationActive",
"74283f3306d49225": "DelegationClaimBotV0",
"116834fbd8e6311c": "DelegationInfo",
"cbb9a1e281fb849b": "DelegationRecord",
"175fc7d5961ca6bb": "DelegationState",
"f4b03fa2a1e0d78b": "DelegationStatus",
"9f52a7540eeb9e71": "DeleteFeedParam",
"6386c2945e441161": "DeleteUserRecord",
"8b9b1a3986f52738": "Delisted",
"55999518f0db1222": "DeltaATooLarge",
"5a6c213ade6c2063": "DeltaBTooLarge",
"75e2df80c45dadcc": "DeltaFi",
"8148c95ae9c30866": "DeltaImbalance",
"ee17de97898f24a3": "DeltaTooBig",
"b76a46ba271def79": "DeltaTooLarge",
"4f650259260f44a4": "DenormalizeNT",
"ca0904f53029a38e": "DenormalizeNTCommand",
"7302c3e479c7db44": "DenormalizeNTCommandItem",
"6a9c2b19c72e5e60": "DenormalizeNTCommandResult",
"3a970d6136e27fc7": "DenormalizeNTCommandState",
"6cb581b34075cb3f": "Denylist",
"474b43cddd77d839": "Denylisted",
"ba3ad4ef66839d92": "DenylistedAccount",
"ce0cb9ed5c114b8c": "DenylisterChanged",
"a70430febf756e45": "Depeg",
"902d0e2b8970e1fe": "DepegType",
"94927942cfad15e3": "Deposit",
"d153535a8d22c54f": "DEPOSIT",
"4e3cf3c6e4806f0a": "DEPOSIT_RECEIPT_SIZE",
"1d580161fb84da47": "DepositAmountBelowMinimum",
"708f8dee3cd97040": "DepositAmountIsTooLow",
"4feea5d06330ae3a": "DepositAmountIsZero",
"9514ece37cf82d09": "DepositAmountsZero",
"d02bb7a0e4b736d5": "DepositAmountsZeroShares",
"4eab9e14b3bc78c0": "DepositAmountTooLow",
"4afb965633b7b660": "DepositAmountZero",
"1a6ce4e1b22ce389": "DepositAndBorrowBlocked",
"1e38a03e0ff9225f": "DepositCapAmount",
"8dadd58d3a01bbe6": "DepositCapReached",
"dccb54799a598f51": "DepositCargoToFleetInput",
"6f2380387b3fa966": "DepositCollateralBlocked",
"3edb6f7bd55d9070": "DepositCreated",
"a1e6aa321f47aae9": "DepositDirection",
"9bd0f466e6f9eba0": "DepositDisabled",
"b8a9ed2dc43e580a": "DepositDisabledOutsideElevationGroup",
"24572db3ea09a509": "Deposited",
"46ab24f1a1f09783": "DepositedToken",
"97e30ada804950f0": "DepositEntry",
"cd4f9b6cb5510fcf": "DepositEntryFull",
"d4573e4902b1e7d3": "DepositEntryInfo",
"165a6cb7b2c05139": "DepositEntryNotFound",
"7b3df9bf9892d0c2": "DepositExecuted",
"3a4fe73c6fefb521": "DepositExplanation",
"2baffb7f411c8918": "DepositForBurn",
"b84cbcee4d4d8c89": "DepositingDurationIsInvalid",
"362d9a342c20e6fa": "DepositingNotActivatedStake",
"d05f1a4e168a2ae5": "DepositingTimePointIsInvalid",
"1deb18deaf335e8d": "DepositLessThanMinimum",
"09d1334134478280": "DepositLimitExceeded",
"e5a06ee18f546a76": "DepositLimitReached",
"047116c25f99a152": "DepositLog",
"e30519c6d980a082": "DepositMetadata",
"88a704eb0923b982": "DepositOnly",
"e922230aeb1aa7a3": "DepositPaused",
"35db5cfa7a1be8f6": "DepositProof",
"53e80a1ffb31bda7": "DepositRecord",
"dcffc6f7a3bb32e1": "DepositRemoved",
"ee2352e045e2950d": "DepositReport",
"58d9ef7e2510bec5": "DepositSnapshot",
"ab5229c6ae7855e8": "DepositsOnly",
"76f61b6832d8f7a6": "DepositStakeLog",
"d60fc021ce0d8372": "DepositStarbaseUpkeepResourceInput",
"3c803ce68d8c82fa": "DepositStartTooFarInFuture",
"df5b3b0b015c13c9": "DepositStatusUpdated",
"306f8aa4479fbd4d": "DepositStillLocked",
"39af05eaa50b5756": "DepositTokenAccounts",
"c42c2e30de07fe78": "DepositTokenStakeLog",
"643c137cb6780e80": "DepositToUserPda",
"44c5a4600c12972b": "DepositWarmupPeriod",
"9be8139192ea8742": "DepositZero",
"9c69615093989b9d": "Deprecated",
"be127ec48b0bf93b": "DEPRECATED",
"20c3d286d9ff6b88": "DeprecatedInvalidObligationId",
"d56d9deb67e91a99": "DeprecatedPlaceholder1",
"5aa4492698043f64": "DeprecatedPlaceholder2",
"7777716d100c05ac": "DeprecatedTreasuryFeeVaults",
"ea81a39a9c7f856d": "DeprecatedUpdateCollateralIdA",
"fe6717d8de66d560": "DeprecatedUpdateCollateralIdB",
"af8eccbb0dc927cb": "DeprecatedUpdateDebtWithdrawalCapCurrentTotal",
"02d53c3bc9efa02b": "DeprecatedUpdateDepositWithdrawalCapCurrentTotal",
"1a8829552e0c0fc2": "DeprecatedUpdateFeesReferralFeeBps",
"51b89f71b60de0a9": "DeprecatedUpdateGlobalUnhealthyBorrow",
"85ff1f8aac4246b7": "DeprecatedUpdateMultiplierPoints",
"ba24c97481568353": "DeprecatedUpdateMultiplierSideBoost",
"3d301597c0096b25": "DeprecatedUpdateMultiplierTagBoost",
"fae3ded6af70c9b3": "DeregisterSurveyDataUnitTrackerInput",
"33a55494d4ac2d05": "DeriskLp",
"0572a7196ee71784": "DerivedKeyInvalid",
"c1f6f8a589c2be0f": "Description",
"c739f640716673d4": "DeserializeMessageFailed",
"ff3af2bc90282352": "DeserializeVaaFailed",
"453308b79676ee92": "DestAddressZero",
"4d12f184d436da10": "DestChain",
"ac00fa7b20a62773": "DestChainAdded",
"311b2577805d6cc2": "DestChainConfig",
"4ab30c00c8e9920d": "DestChainConfigUpdated",
"c669c5d24d8c5910": "DestChainState",
"867530c3bbbf1833": "DestinationChainDisabled",
"460a1aa65567a91b": "DestinationDomainIsLocalDomain",
"62120d7e4fac4da4": "DestinationStakeMustBeDelegated",
"5364900995980c96": "DestinationStakeMustBeUpdated",
"5449a50a35445049": "DestinationStakeMustNotBeDeactivating",
"9789a5f455f86833": "Destroyed",
"2365806ad83db79d": "DestShouldBeSignerInCustomPayload",
"f358e94b1c20df7a": "DetailsFinalized",
"c9520ac1d847e1c2": "DevAddCrewInput",
"95c420be9d6a4a5e": "DeviceFeesV0",
"4c011510faffdb05": "DeviceFeesV1",
"e1402b2301f938ee": "DevOnlyFrequency",
"ec1eb550d1d919a3": "Dex",
"dd7ad70732b20b09": "DEX",
"d1b077c440caddbc": "DexSpecificPrice",
"8ade6cd564e535e8": "Diamonds",
"e25422596188a592": "Dice",
"8136656c2fe82f4f": "DidNotReceiveExpectedReferrer",
"53c4af9f59fc3430": "Diff",
"908634c12b519b93": "DifferentCurrencies",
"945880fc0e1dfab6": "DifferentWhirlpoolTickArrayAccount",
"000b7ab571707f62": "DIGEST_SIZE",
"d6ddaa2e7ade9f37": "Direction",
"ce4dcfd019f451ac": "DirectWithdrawInitReceipt",
"c091857dcc969104": "Disabled",
"a88aaecac5489bb2": "DisabledFeatures",
"87cb17c75c19867d": "DisabledMap",
"1e4e896c7df28c18": "DisabledMapEntry",
"a03fe46456a83843": "DisabledMarket",
"2e1fed7312a02063": "DisabledMultiAttribution",
"c27a4257a43cac6d": "DisabledOraclePeg",
"781b5a9137b89b1f": "DisabledTransceiver",
"35067f17f70ce1f9": "DisbandedFleet",
"99db8baa839f807d": "DisbandedFleetNotEmpty",
"ee9a5ce2df51c41e": "DisbandedFleetToEscrowInput",
"eb963d944713266d": "DisbandFleetInput",
"fd4d0e54ebd5cf7a": "Discount",
"bbc1b7f2c776e1ee": "DiscountTokenNotFound",
"5f58c457656c439f": "DiscountToMaturity",
"026fa1320a6199f4": "DiscountToMaturityData",
"5d4b325c2f2a70cb": "DiscoverSectorInput",
"d4370c9d7424b1e7": "DistanceGreaterThanMax",
"3a7982ca82b76b6f": "DistributeCompressionRewardsArgsV0",
"461ccb5b1cf949b8": "DistributeGrandPrizes",
"683e1f2e547dda9d": "DistributeLeaderboardRewards",
"13e54e95cc4e389b": "DistributePositionImpactReport",
"f184a7a973fa08fb": "DistributeTeamRewards",
"92d5287862778e91": "DistributeTokenReward",
"1374f38188fc2c3c": "DistributeTokenRewardLog",
"93515f6a64ec1779": "DistributeVaultFees",
"b055110b0dc21201": "Distribution",
"625a704131a1c69a": "DistributionAccount",
"ef89309c5e8fcd1d": "DistributionClaim",
"c64677cb6fed28ac": "DistributionRatioSet",
"e24f44b9dd7bbc0b": "DistributorAuthoritySet",
"bd178b521e561ffa": "DivideByZero",
"a7bfe73f9229731b": "Domain",
"0684f207770d7701": "DON",
"bbbbfb3de9949780": "DonConfig",
"979442a1a8d8457d": "DonConfigs",
"65819f0607ad0c02": "Done",
"37822d784de64de7": "DoNotNeedToExitWithoutOre",
"bf809aeffafe5f29": "Double",
"d48c078d38decae5": "DoubleWithdrawFunds",
"e11cf09e05867a1f": "Down",
"91a7da1587b7cdd4": "Dozen",
"c57c9cd49124eeda": "Dradex",
"dc415ac131b5e0e3": "Draft",
"5eca69e214255d95": "DrawLottery",
"a96922b5f361c3d4": "DrawMoneyLine",
"585538b616a874cd": "Drift",
"acd7deba0c26c373": "DriftAction",
"c9c8ad9e02b85499": "DriftDirection",
"2948f4d2097c3beb": "Drifting",
"95021dbbbf7476bf": "DriftingOppositeDirection",
"65d91785c1a81e05": "DriftInsuranceFund",
"ad16fa0ee7b839a4": "DriftSupply",
"5cb041d780e01e79": "DriverIsNotUnlocker",
"446f2f4b89bfe22e": "DriverIsNotWinner",
"379d9aebc83d41af": "DriverNotWhitelisted",
"8af795f3faf0bdcc": "DstConfig",
"802740f2090a695c": "DstConfigs",
"fc3a8420439bb787": "Dual",
"8957ea6c25e754cf": "DummyInstruction",
"91781e6961334d4c": "DuplicateAccountInFillOrder",
"f59c303545364786": "DuplicateAddress",
"8e952090b05807c4": "DuplicateAuthKey",
"5a767386fa15a24b": "DuplicateCreatorAddress",
"3c6401dd101f6962": "DuplicatedGroupLabel",
"0e7358e895a7722a": "DuplicatedMintLimitId",
"ece4665db2f0ce6b": "DuplicatedOwner",
"a61b7ae1251a0e0a": "DuplicatedRemainingAccountTypes",
"d2709b58db376b26": "DuplicateEpoch",
"86b8bbed4297b09f": "DuplicateGuardianAddress",
"ebb10d301a214072": "DuplicateMember",
"3cc02aca96fc2548": "DuplicateModes",
"ebf35a3d6f8f1fab": "DuplicateRoyaltyTier",
"9f0337d304831e0d": "DuplicateRwaProtocol",
"93c0e643bbd743c7": "DuplicateSignature",
"8bf6f1d43712aea3": "DuplicateSigner",
"41aac36d36cf9333": "DuplicateTransmitter",
"844a11f42e7ade90": "DuplicateTwoHopPool",
"1a886ceeb556993b": "Duration",
"661951751fd00084": "DurationTooLong",
"da82e67eff1c47a3": "DurationTooShort",
"6b278832f58b0651": "DUST",
"824271346141a6c2": "DUST_TWAP",
"31512162eaa85d49": "DvnConfig",
"6dc9dad79e6cde91": "Dvypass",
"d5926332e20c50a3": "DvypassEmission",
"a1819da37fe34360": "DvypassReward",
"5810f56d662e1afd": "DvypassStake",
"7854a319cf02add6": "DvypassV2",
"9590759559f46858": "DynamicConfigParameters",
"f4e258520e3bf6dc": "DynamicFeeConfig",
"c48887a004876e2e": "DynamicFeeParameter",
"b53a463ad01f75ed": "DynamicFeeParameters",
"84ab06e7c4819b01": "DynamicFeeParameterUpdate",
"457f967acd4522f4": "DynamicFeeStruct",
"15fb849deee5bc4d": "DynamicRoyalty",
"f1eeab9b34436494": "DynamicRoyaltyPriceLinear",
"4d9e3c66bbaf7b6e": "EarningsPerOreIsNotIncreased",
"504afa8b7a9bae54": "Ecosystem",
"ea75f94a0763eba7": "Edition",
"24c5350132863875": "EDITION_SEED",
"7c760c6476d78d63": "EditionKeyNotEdition",
"989b5aae41a39a38": "EditLimitOrderLog",
"8ade27ee66d98e97": "EditPoolConfig",
"921ff2dfa007f351": "EditTriggerOrderLog",
"2947961b2cfefcce": "EfficiencyIsZero",
"584e17f197141675": "EidNotSupported",
"24c57ec399bc28ad": "Eight",
"668086b08104a3a5": "ElevationGroup",
"cd9f36a8316fe2a4": "ElevationGroupBorrowLimitExceeded",
"e6f69d6b13ddd810": "ElevationGroupDebtReserveAsCollateral",
"62e5e372814e07b9": "ElevationGroupHasAnotherDebtReserve",
"f6bcdad7b364058b": "ElevationGroupMaxCollateralReserveZero",
"07a6d0008977bebd": "ElevationGroupNewLoansDisabled",
"98c1a659d4560001": "ElevationGroupWithoutDebtReserve",
"158346e7860bdbd0": "Ema1h",
"71edc63aa725187c": "EmaTwap",
"f07c82254bb427c0": "EmaType",
"1563642e0e3ad0d4": "EmergencyLiquidationBlocked",
"78fef17a1173ed9c": "EmergencyLock",
"c2b643d2a09aa03f": "EmergencyMode",
"37a77918a4a9c7ed": "EmergencyModeEnabled",
"ba56e7266d311543": "EmergencySwapBlocked",
"c2cfc7ec7644113a": "EmergencyUnstakingFromNonZeroScoredValidator",
"c1c449b8fd80bb68": "EmissionScheduleItem",
"87b577bec37cf818": "EmitterInfo",
"94be58c9ef90f62d": "EmitterSequence",
"b8d5520302eecaec": "EmitterType",
"f365134dc5cb3cd2": "EmodeConfig",
"1d210fc7e694e44d": "EmodeEntry",
"77584ae797bb6b3b": "EmodeSettings",
"0f4017dfdcf329db": "Empty",
"ae9cba71e69e21d7": "EmptyAccount",
"85754f5db0244039": "EmptyConditions",
"47802d7efb3c895c": "EmptyDeposit",
"53cb9406de4b804f": "EmptyGlvWithdrawal",
"ad53be743610c0a4": "EmptyInputs",
"a9ab32f32abe7efa": "EmptyMembers",
"fcd70db527e51ead": "EmptyOrder",
"a39d37a468fc424e": "EmptyRoute",
"e9fd1d56544db187": "EmptySettlementMerkleTree",
"fa05c9d037ece2b8": "EmptyShift",
"e4872cccd37a9eed": "EmptySigVerifyInstruction",
"4be571955582134e": "EmptySupply",
"ba8fc1f95c353cfc": "EmptyTokenList",
"70721380a082d5bf": "EmptyTradeState",
"8bca8e7141b8f709": "EmptyTreasury",
"699a628708148751": "EmptyWithdrawal",
"86174827e459a377": "Enabled",
"4db610f91712b863": "EndDate",
"6265826ebc3f86e4": "EndedRound",
"dde849380a42480e": "EndpointSettings",
"067fa0df2156eb20": "EndTimestamp",
"72dd2bae05250814": "EnforcedOptions",
"c45ca2685b0a991d": "EnforceWalletUniqueness",
"ee4a93ce1a105ab5": "EnqueueWithdrawalBatch",
"36928d34d1503591": "EnqueueWithdrawalBatchCommand",
"0f66057f2fe0a4f6": "EnqueueWithdrawalBatchCommandResult",
"c61629a3d7820cd6": "EnqueueWithdrawalBatchCommandState",
"3f129871d7f6ddfa": "Entry",
"92c9448480117897": "EntVaultIsEmpty",
"5d537859978a986c": "Epoch",
"b20bc3f50151f884": "EpochEnded",
"03cca5d57b1b4595": "EpochHasNoPointsAvailable",
"0e099e871b31df29": "EpochHasNoTokensAvailable",
"1ba8dae330e2ce78": "EpochHasRedemptions",
"cab3c73260f2f99a": "EpochHasSubmissions",
"b382d0bedcfd85bd": "EpochMaintenanceNotComplete",
"3a1a4d0fdfd487c5": "EpochNotClosed",
"428cb93e649e7be1": "EpochNotOver",
"92de31c37b4f5e2e": "EpochOutOfRange",
"42e02e02a789786b": "EpochPda",
"bf3f8bed900cdfd2": "EpochState",
"2bd08e115f02d0bd": "EpochStillInProgress",
"126a30e7862e88bf": "EpochTooEarly",
"a5f4f1569508c774": "EpochTooLarge",
"fa03aec2e1c09093": "EpochToScaleToSumAccount",
"bfeebc972138de35": "EpochTrackerV0",
"310c8fecbb4493b1": "Equality",
"e74cc2e31d5dafac": "Equity",
"e9d31d7af9021eaa": "Err",
"8ecf964aa553c3ce": "ErrorInDivision",
"16cd9a1e89559cb4": "ErrorOfAccountParsing",
"1fd57bbbba16da9b": "Escrow",
"ac788c348812149b": "EscrowAccountNotZero",
"9c8b6e2557e8a7a2": "EscrowBalanceDecreased",
"2edec2351ecb5a08": "EscrowClaimToken",
"faa380810c6b5819": "EscrowClosed",
"885437d51781f999": "EscrowCreated",
"3898d0a09f530611": "EscrowDeposit",
"33bd1abbe52682c1": "EscrowFeeTooHigh",
"1a80d2fb41035562": "EscrowHasBeenEnded",
"f3b8734334c2176f": "EscrowHasRefunded",
"aaa0ad645e776b51": "EscrowHistory",
"ed415bf5497b0666": "EscrowIsNotClosable",
"e525a8a1c555446a": "EscrowIsNotMaxLock",
"d0a23b37fd46f437": "Escrowless",
"ad7214f0b3686a48": "EscrowNotCancelled",
"11d1145a41ea3bca": "EscrowNotEnded",
"a76315c8f9fb8042": "EscrowOwnerNotWhitelisted",
"f3a5f809a072130a": "EscrowProgramNotSet",
"84282cfb64b7741c": "EscrowRemainingWithdraw",
"0de3281606ae7ea5": "EscrowWithdraw",
"ebd73606d0d7ff95": "ETH",
"dc5f94041ef51bd6": "ETH_EMA",
"f29f35faf3d6eef4": "Europe",
"1955287cdabce176": "EVENT_AUTHORITY_SEED",
"c9bf093ff9dd25b2": "EventAccountNotTracked",
"b11f59f35da3e75d": "EventBufferNotProvided",
"7bfcb9b3d8b09e93": "EventCancelVestingEscrow",
"1419af106d52d3e6": "EventCancelVestingEscrowV3",
"9cb16556ec49ac42": "EventClaim",
"cbc74abcb37507d6": "EventClaimV3",
"c2ed978ab7eddc51": "EventClocks",
"d4d2af1dde8f7b1b": "EventCloseClaimStatus",
"7cd6a3e67d227c67": "EventCloseVestingEscrow",
"dc01557186e50575": "EventCreateRootEscrow",
"1330b57c9b8240dd": "EventCreateVestingEscrow",
"f5e0b7882a759aaa": "EventData",
"bb47ceab37c9952f": "EventFundRootEscrow",
"773b3d13a55439af": "EventHeap",
"078ea9754c0b88e3": "EventHeapContainsElements",
"d7c5d64ade644b7c": "EventHeapHeader",
"ab81ab86388a5a46": "EventNode",
"ad2f54c0ca74eea8": "EventOtherState",
"d7ed5f8282093d0b": "EventPool",
"4cf56ddbab056783": "EventPositionState",
"5ba5cc6ed9e47c1c": "EventStartTimeInvalid",
"43b244aed3fb3855": "EventStatus",
"37b24fd548ccd532": "EventTradeFees",
"f5989d0c3cdae22b": "EventTradeOutputAmounts",
"ba834580e596d39d": "EventTradePnl",
"ea275c3e8e41f3a1": "EventTradePrice",
"cbae4419aefee826": "EventTradePrices",
"72ed04059b5aacde": "EventTransferOut",
"8256b0b5b2927b53": "EventType",
"601ef497de1a8d3a": "EventUpdateVestingEscrowRecipient",
"13bbb262051f30a6": "Evm",
"f28c0b735d170119": "EvmTransferRequest",
"eda8dc58f8e48673": "EvtAddLiquidity",
"02cd9d855aeab2e7": "EvtClaimCreatorTradingFee",
"385d0fc4ad250a03": "EvtClaimPartnerFee",
"0f94f34f28def231": "EvtClaimPositionFee",
"3b84dad6c2a8d910": "EvtClaimProtocolFee",
"d144e8e5248a7506": "EvtClaimReward",
"07f143c8858a06c6": "EvtClaimTradingFee",
"b5d0994222738d16": "EvtCloseClaimFeeOperator",
"a936fa5942a3c9ad": "EvtCloseConfig",
"d65f323d34b3b6cb": "EvtClosePosition",
"658ce217b5967523": "EvtCreateClaimFeeOperator",
"3472228ce7ec7a8f": "EvtCreateConfig",
"470b0aa9363e1584": "EvtCreateDammV2MigrationMetadata",
"d62c5d55e6339e2a": "EvtCreateDynamicConfig",
"e17da5505ebea8e5": "EvtCreateMeteoraMigrationMetadata",
"873e4b67f6c81528": "EvtCreatePosition",
"cadff99aab30e17f": "EvtCreateTokenBadge",
"b4d8d6abfa4e106e": "EvtCreatorWithdrawSurplus",
"4741ab87da521f2a": "EvtCurveComplete",
"884d09108c24e1a2": "EvtFundReward",
"8cca5c0d5355bec5": "EvtInitializePool",
"f6d42cfe324def29": "EvtInitializeReward",
"622d8ba2794faf1c": "EvtLockPosition",
"1e13e450383aa080": "EvtPartnerMetadata",
"08fcbf08568a8480": "EvtPartnerWithdrawMigrationFee",
"374bdea0192f8f17": "EvtPartnerWithdrawSurplus",
"43ab902a54f9d5e2": "EvtPermanentLockPosition",
"fe0e0a4302a83d5e": "EvtProtocolWithdrawSurplus",
"8bfa71ac3323baa0": "EvtRemoveLiquidity",
"700e5efc5ad9a30e": "EvtSetPoolStatus",
"39f652f997e4dc27": "EvtSwap",
"4f98742cb3d3f687": "EvtUpdatePoolCreator",
"e03cfb62b4606258": "EvtUpdateRewardDuration",
"ecdf58adb270088d": "EvtUpdateRewardFunder",
"406d4fbe7bfb73d6": "EvtVirtualPoolMetadata",
"a72967373cbb5096": "EvtWithdrawIneligibleReward",
"ffa24a2469dcaecd": "EvtWithdrawLeftover",
"7b9cb192f3b2ba8a": "EvtWithdrawMigrationFee",
"368e590aec1afe4f": "ExactIn",
"0886216e59a7eb65": "ExactOut",
"13e0fc6ed90b6caa": "ExactOutAmountNotMatched",
"a68873d518162fc1": "ExceededAmountSlippageTolerance",
"f0656ad4546bf258": "ExceededBinSlippageTolerance",
"e8b6916b6e5ca3bf": "ExceededLength",
"0f6dab1a83e8b6fe": "ExceededLiquidity",
"fa0b33916afa591a": "ExceededMaxClaim",
"a41d4fa0b66c954a": "ExceededMaximumFreezePeriod",
"23f954afa1c0c73d": "ExceededMaxMessageSize",
"0dcdf0c34ada6a89": "ExceededMaxOracleLength",
"49648e128be00078": "ExceededProgramListSize",
"dc095af4d15b0447": "ExceededSlippage",
"57da7a5dde200924": "ExceededU128",
"87a0176f1d809ad2": "ExceedExecutionPeriod",
"5ebc3d4d6404240c": "ExceedMaxAChanges",
"ac9f9189fc11b161": "ExceedMaxFeeBps",
"77787c9bc333cfaa": "ExceedMaxGlvMarketTokenBalanceAmount",
"607c5f36220b4259": "ExceedMaxGlvMarketTokenBalanceValue",
"5ad6445e1bc422e2": "ExceedMaxLength",
"740ca4a62b94a627": "ExceedMaxLengthLimit",
"ebbe4b20b06ad180": "ExceedMaxSwappedAmount",
"e76171c03e6394b0": "ExceedMaxWhitelist",
"fadd5aa05c8a0582": "ExceedPoolBalance",
"e52c879ee7f5b6af": "ExceedsDailyAirdropCap",
"bc05e7e95daf05fe": "ExceedSlippageSetting",
"a11d2d1c6c0e5c39": "ExceedsMaxBorrowUtilRatio",
"e029a2db0859f8ef": "ExceedsMaxPayloadSize",
"b6fe3d944f80dcbd": "ExceedsTargetWeight",
"2ff3addbbdf922b9": "ExceedTokenWeightage",
"df987cf2f329faf8": "ExceptionErr",
"3a2cefbbaaf70d35": "ExceptRewardMint",
"6019b37bd4e2e794": "ExcessiveFeeUpdate",
"4273cea99e41625e": "ExcessSigners",
"1ec8dc95033d6832": "Exchange",
"abb3d741bb0df90f": "ExchangeAcceptTooLow",
"5ff5f63a62e26983": "ExchangeConfig",
"1137faae65a45127": "ExchangeHistory",
"2e6a90ebbd0684e6": "ExchangePaused",
"4f17c1c8055d9267": "ExchangeStatus",
"301c606d3d3a8ce3": "ExcludePnl",
"159131e53435ef6e": "ExcludePreviousFill",
"cf6e4da1b6ea9d1c": "Exclusive",
"d41e86bcc335d72c": "ExecContext",
"67a46686ab1a1a33": "Executable",
"7d867f96d9580ab8": "ExecutableEmitter",
"f23c99d4a2129bba": "Execute",
"41633c2d416bd36f": "ExecuteCompound",
"a4b8b4abffa45884": "Executed",
"69c8c5e52082a615": "ExecuteDistribute",
"2211897b3e19cd9b": "ExecuteHash",
"a7dcbc7abb34278c": "ExecuteLimitOrder",
"be50a82b90947b80": "ExecuteLimitOrderLog",
"7e6698de34673aae": "ExecuteLimitOrderLogV2",
"1639b72c72f4b195": "ExecuteLimitWithSwap",
"a63296a322c44a95": "ExecuteLimitWithSwapLog",
"9815eabae2ce076d": "ExecuteLimitWithSwapLogV2",
"cec290a8274ce27a": "ExecuteRestakingVaultUpdate",
"8476b73239828009": "ExecuteTransactionDigest",
"a5a614ea93a9a1d6": "ExecuteTriggerOrder",
"377f71245be7d33d": "ExecuteTriggerOrderLog",
"9ff316636e4efde0": "ExecuteTriggerWithSwap",
"c47e9a735490794c": "ExecuteTriggerWithSwapLog",
"40d16d7404f0f58a": "ExecuteWrappedTokenUpdate",
"94199e6ef90bbd8d": "Executing",
"3294e1a38121e528": "Execution",
"6b1c9db7aaa54de1": "ExecutionReportSingleChain",
"1fd12385848e9764": "ExecutionState",
"be68fe47d4fa4d61": "ExecutionStateChanged",
"721601cf5ff7d10c": "ExecutiveWithdrawAction",
"51a863639c8610a6": "Executor",
"8611e2180aad9d4e": "ExecutorConfig",
"22646b97b990b7a7": "ExecutorIsAdmin",
"09cc4717e1b21382": "Executors",
"207b226cebc218f3": "ExhaustedLiability",
"f901a653706a4a41": "ExistingMerkleRoot",
"a16c225f149fc79b": "ExistingNfts",
"4e0765258d5e3bae": "ExistingRewardOverride",
"c2b6b0fb2fa44cad": "Exists",
"1919a0df359baaa2": "Exit",
"25473e505d382556": "ExitPriceAndFee",
"29d52123c26c25ca": "Expander",
"d5494da059eee065": "ExpanderStep",
"5c5fde6b122c71e8": "ExpandOrContract",
"e6dcdd3e5520a246": "ExpectedAccount",
"7dcd88f8e62dd43c": "ExpectedClearGains",
"0f6339dd7f7a5a68": "ExpectedMint",
"40f364ef21c5f913": "ExpectedPriceAccount",
"9565028bdd973c71": "ExpectedSolAccount",
"1cf6e19ee7768397": "ExpHeuristic",
"dcb81572e70ad698": "ExpirationIsLessThanCurrentTime",
"b9ba27573f5e9a5d": "ExpirationIsNotZero",
"101c65ecd88dfa1e": "Expire",
"7e0958858df6c91c": "ExpiryTooLarge",
"3946dcebc9c46656": "Exponential",
"0b86597fa9aba323": "ExponentialCurveV0",
"17b724ae21b0291a": "ExposureLimitExceeded",
"cc4b8507aff1820b": "ExpressRelayMetadata",
"ed9ab000fa10f601": "EXTENSION_BINARRAY_BITMAP_SIZE",
"5cb6149277d25acf": "External",
"0809dd8c92755641": "ExternalMarket",
"7252f0fdf7c37d5d": "ExtraArgOutOfOrderExecutionMustBeTrue",
"d23afa5442771efe": "ExtraCollateralAmount",
"8314df16e3cce723": "Faction",
"4fb5ddce547478ad": "FactionsStarbaseLevelInfo",
"3e69f4656b3eebed": "Factors",
"33348468666ade44": "FailedFvcVerification",
"0394553e47d12047": "FailedMerkleProofVerification",
"dceeeaf2f9c4e031": "FailedOpenbookV2CPI",
"a85ee8398720042d": "FailedPhoenixCPI",
"b2aa8ac15f8a957f": "FailedSerumCPI",
"d95115102f12f374": "FailedToCalculateGlvAmountToMint",
"92bd2aec1798ffce": "FailedToCalculateGlvValueForMarket",
"ca99e5457514c804": "FailedTOCalculateMarketTokenAmountToBurn",
"e3f4e23aab443982": "FailedToDeserializeOracleMessage",
"7c5b26dbe8abff45": "FailedToDeserializePhoenixMarket",
"d35451c9538f7d16": "FailedToDeserializeReport",
"8256a0d204f48307": "FailedToDeserializeVoteAccount",
"b0b3e2ff722bb5a4": "FailedToDeserializeWalletLimitInfo",
"4fcf032b72cbfe3a": "FailedToFillOnExternalMarket",
"ff823ac966499927": "FailedToGetMint",
"dd4ce47fdbf67e99": "FailedUnwrap",
"0b56ca5062e4b57e": "FailedVocVerification",
"f3ef273208bbbbca": "FailedVotingPowerCalculation",
"4306cee23c4bf2c6": "FailToValidateSingleSwapInstruction",
"719336312e39d871": "Failure",
"a19cd3fdfa4035fa": "Farm",
"c57fba6801e9363d": "FarmAccountsMissing",
"1f8a618336bbb4ff": "FarmConfigOption",
"82a7c60195ab8c6d": "FarmDelegated",
"fc9a949a7e200401": "FarmNotDelegated",
"6f6a0d4635225019": "FarmNotEnded",
"c666d84a3f42a3be": "FarmState",
"10c5607528e29b61": "FarmType",
"9613ce99187e6f95": "FarmVaultHasCloseAuthority",
"6696a7d134a0d0bc": "FarmVaultHasDelegate",
"146c4320461b96a8": "FaultToleranceMustBePositive",
"edfd246c047f4b57": "FaultyLpMint",
"c305f452e2985e79": "FaultyMovement",
"9bad2a1df2ce7137": "FBondBumps",
"5d388b03835fb236": "FcfsConfigParameters",
"63f3fc7aa0af8234": "FcfsVaultConfig",
"e2c3a37e669344d4": "FcfsVaultCreated",
"d178b781b7565ca1": "FcfsVaultParametersUpdated",
"adc3613889a9d776": "FeatureDisabled",
"5025450b03958448": "FeatureNotImplemented",
"183796faa81b65b2": "Fee",
"729239e1dcbc8681": "FEE_COLLECTOR_SEED_PREFIX",
"649b3d03efe25bc7": "FEE_DESTINATION",
"892d90f611ed6afb": "FEE_PRECISION",
"c76fe6007d9bcaa1": "FeeAccountNotSpecified",
"6ca17ab18282eb5a": "FeeBps",
"cfe12540616f9868": "FeeBpsTooHigh",
"6f78d60c23e61fc4": "FeeBpsTooLow",
"8ded676da4f0eff3": "FeeCalculation",
"6a4468ade1ed3930": "FeeCalculationFailure",
"a61c44f8df2059ef": "FeeCents",
"88db32b362b3767b": "FeeCentsValueChange",
"fad549c8af4ce1d5": "FeeCollector",
"8f3492bbdb7b4c9b": "FeeConfig",
"48d4756cc26f8b40": "FeeConfiguration",
"0365addf11839836": "FeeEmission",
"004dacb8221f9d2b": "FeeExceeded",
"a362991c3feb06a6": "FeeExceededDeltaOut",
"656303873877e96b": "FeeExceedsTotalAssetValue",
"ca3ce241fdd3a530": "FeeInfo",
"b6b748ddfe865151": "FeeInverseIsIncorrect",
"3f6662874953237d": "FeeMap",
"2799723d85227dfa": "FeeParameterUpdate",
"03fc32a24c2e90d5": "FeePayer",
"abec8a73f26d24b7": "FeePayerRates",
"2b09094f6f7d8d29": "FeePayment",
"c70d926b3e3d7472": "FeeRate",
"ca55173734efd7fa": "FeeRateMaxExceeded",
"25de88f92ca2732f": "FeeRateRefIsNotZero",
"6c39f03cf5043af1": "FeeRecipientSet",
"bbf8b502b7a542af": "FeeReduction",
"979d32738248b324": "Fees",
"2e10d74539287681": "FeesAction",
"37cd481a6c15b267": "FeesCollected",
"7c57260ad5872033": "FeeShareTooHigh",
"09d9f5817ce94111": "FeesHigherThanBid",
"052f3ed00f1f6928": "FeesMode",
"d25075c8b010cafa": "FeeSplitLargerThanPrecision",
"0dba3784750dde16": "FeesStats",
"3fe01055c124ebdc": "FeeState",
"a4793e0d59dc78f5": "FeeStateCache",
"720b7af4a8eb0319": "FeesTooHigh",
"d8cc64c61fb998de": "FeeStructure",
"3fb284366df32fb2": "FeesWithdrawn",
"384b9f4c8e44be69": "FeeTier",
"3219d7a40eadf500": "FeeToken",
"a30084e76499ccff": "FeeTokenAdded",
"6dd32fd0f7d56619": "FeeTokenDisabled",
"4b7633a74776132d": "FeeTokenEnabled",
"c25b7c1da8b89f4a": "FeeTokenRemoved",
"38d008b545783cd3": "FeeTooHigh",
"764f8c2466d92834": "FeeUpdate",
"0abc594004b7e700": "FeeValue",
"1955c9e79c3c2b02": "FeeValueChange",
"c0b245e83a959d84": "FeeVault",
"dedc911ea93b939c": "FeeVaultIsNotSet",
"9eeec33f14579dab": "FeeWallet",
"4cfa5991e92d2655": "Field",
"f6748e7accc72c71": "Fill",
"4046a860b8d828a4": "Filled",
"75a8107b66f99909": "FillLog",
"ace3821e3234835e": "FillMode",
"dcc45dc2982b4fb8": "FillOrderAmm",
"96b864059948e4ff": "FillOrderDidNotUpdateState",
"b2c02d60e2cdafd4": "FillOrderMatch",
"76a611cf1a07f6d5": "FillOrderNotAuthorized",
"3d9d87a0fda77470": "FillPaused",
"1ef0305097a15baf": "FinalCollateralTooLow",
"e6faf5cf85db6750": "FinalizeCounterExceeded",
"f026006dd30f4aa6": "Finalized",
"8f218ec1fb397ce0": "Finished",
"273613e710cfd4ae": "Finite",
"53450ac2767d56d9": "FirstBuyMustBeAtMost50PercentOfTotalSupply",
"d7335d329aa746a1": "FirstDepositMustBeFromAdmin",
"e267a3fa62e25b49": "Five",
"2e1b42c9ed6643f5": "FiveMin",
"513a4f065ca8adaa": "Fixed",
"f7300e3ec54d1ac6": "FixedCurve",
"733a85f42cb7e5a4": "FixedLimit",
"2a673a11ec9f3480": "FixedMint",
"78dcb8fd7357078b": "FixedPoint",
"f7756b98d8dec75e": "FixedPrice",
"447fd3f16b8b99e9": "FixedPriceInvalid",
"776bb008b6efb77b": "FixedRule",
"f371289285f2d63e": "FixedSide",
"f8c2e93b80e28156": "FlashBorrowCpi",
"f76d60b20150ff1e": "FlashIxsIncludeScope",
"42e5ba1f26cc4f3a": "FlashIxsNotEnded",
"dbc1f4ff0725bd29": "FlashIxsNotStarted",
"cb107126f35401e3": "FlashLoanPool",
"91b94a617c17a99a": "FlashLoansDisabled",
"2ecc89e9869b8dd9": "FlashRepayCpi",
"1bdf0abac2722209": "FlashSwapIsNotStarted",
"c5e803b70213d2f0": "FlashSwapTooEarly",
"e484c56a8978ff59": "FlashTakeOrderBlocked",
"16f6b1ca98f51735": "FlashVaultSwapBlocked",
"28857c1094df9650": "FlashVaultSwapWrongAmountToLeave",
"6dcffb306a0288a3": "Fleet",
"038856935111612a": "FleetCrewInput",
"1187f936a81b777a": "FleetCrewNotNormalized",
"7d8880d7d92e3845": "FleetInfo",
"18a5b1d1c3d49a78": "FleetInput",
"fc5193f6de8db96e": "FleetShips",
"f684e755a7500c63": "FleetShipsInfo",
"0d215e829aee6f23": "Flip",
"1a22854fee7e92c9": "Floor",
"afb2ab1ebbfd0d76": "FlpStake",
"f3d202b509b54512": "FluxBeam",
"a90589b929004576": "FndAmountCantExceedBidCap",
"3467236d78767eec": "FollowUpActionsNotProvider",
"54f57f7115cb7828": "Food",
"fcd44e695013976b": "ForbidBothZeroForSupplyLiquidity",
"5d21a76e3de8b26d": "ForbiddenCollection",
"8b06314b8016b10c": "ForbiddenCpi",
"2fd3b1334e3014a3": "ForceClosePositionLog",
"71fac7f066273256": "ForceClosePositionLogV2",
"f4bd7b5bce7d1b92": "ForceClosePositionLogV3",
"1b956ca6d821e000": "ForcedDisbandFleetInput",
"6e621c5293918f40": "FORESTER_EPOCH_SEED",
"51fea1274f69afa3": "FORESTER_SEED",
"3afdfdf3ad516da4": "ForesterConfig",
"e1ae105331c0231a": "ForesterDefined",
"1d75d38d638ffa72": "ForesterEpochPda",
"9435802cb9dd3440": "ForesterNotEligible",
"332fbb5652997505": "ForesterPda",
"44e6a44124977029": "ForesterUndefined",
"f6c49199bcc16003": "Foundation",
"86c7a3a95a0db65e": "Four",
"7ae68f93bb7fe945": "FoxBuyFromEstimatedCost",
"e058a0f9e83a9c4d": "FoxClaimPartial",
"23f1864dba079b61": "FragmetricNormalizedTokenPool",
"1c9af8b965c058f2": "FragmetricRestakingFund",
"7fab3e65e7c0cd6f": "Frakt",
"8b7a9ff44f7bfb7d": "FraktBond",
"2cff684312e7c62c": "FraktBondState",
"2597ab13eaddea54": "FraktMarketNotActive",
"0bf27da0fe971b9d": "Francium",
"cc7d593fb2f45995": "FreeNode",
"be63d34fa54c8bae": "FreeTaskAccountNotEmpty",
"e4ea60bce3d657b2": "Freeze",
"70895408005d8651": "FreezeDelegate",
"e3ba289807ae83b8": "FreezeEscrow",
"202e0af1619b68b6": "FreezeGuardNotEnabled",
"9ce5951052ec9c2e": "FreezeInstruction",
"f325e095c9e0279b": "FreezeNotInitialized",
"fd66c5bc34efd6ad": "FreezeSolPayment",
"563df5c80486e979": "FreezeState",
"a499d760139cee95": "FreezeTokenPayment",
"0c217b89937a58a1": "FrequencyIsZero",
"2f5adfeaf9395d26": "Frozen",
"827c4bed1de4ec48": "FrozenForUndelegation",
"cfc86e39e8f38f80": "FrozenPod",
"bf4334cfb43e4a87": "FrozenVesterAccount",
"f589bb6b2b82a92b": "FrozenWithdrawn",
"11126bb1d036b689": "FTT",
"099e7d3781119323": "FTT_EMA",
"9041e2fe4998d4dd": "FuelSeasonRecord",
"a547916677eb0552": "FuelSweepRecord",
"a3594af3c686636a": "FULFILLED",
"3a66362ad17b6227": "FulfillInfo",
"2a444796909b42af": "Full",
"54465691dd0ab4e1": "FullBalanceListFull",
"a92b0d175959ad1b": "FullBalanceListMetadata",
"fd123a733df2f56f": "FullFill",
"d69d7552c3a9d7c0": "FullMerkleProof",
"7239ae59d8118a39": "FullRangeOnlyPool",
"9c1092a3ccd01dd3": "FullRewardInfo",
"0a8413219de7eb8f": "FullyVested",
"4f4d62846db9772f": "FunctionPaused",
"3e80b7d05b1fd4d1": "Fund",
"ff32f8d73507ccd6": "FUND_ACCOUNT_CURRENT_VERSION",
"8464a5ab7de55a21": "FUND_ACCOUNT_OPERATION_COMMAND_EXPIRATION_SECONDS",
"63aa7773eabe5ece": "FUND_MANAGER_PUBKEY",
"3168a8d686b4ad9a": "FundAccount",
"940725429ef154e0": "FundDepositNotSupportedAsset",
"32afd6c4c86e91a1": "Funding",
"796fd4e0f91a166e": "FUNDING_AMOUNT_PER_SIZE_ADJUSTMENT",
"da6ecbe130ffe9dc": "FundingAmountPerSizeForLong",
"af3883ec1f8bc904": "FundingAmountPerSizeForShort",
"7b6cbfb3bf8e4af0": "FundingFees",
"6f0ae2611d2b818d": "FundingPaused",
"208043914546b85d": "FundingPaymentRecord",
"1b0bfb7cf01e2898": "FundingPeriod",
"83b426f888afda0b": "FundingRateRecord",
"85b1cd29b3d69884": "FundingRateState",
"bd2092f78b122383": "FundingWasNotUpdated",
"f4f6fda166298c43": "FundIsActive",
"3181d7b2cf25fc0e": "FundManagerUpdatedFund",
"a62d625e2efaf89f": "FundManagerUpdatedRewardPool",
"4ef0c3e8a6337dbe": "FundOperationCommandAccountComputationException",
"a2465b908047764d": "FundOperationCommandExecutionFailedException",
"8ee2057caf0a4131": "FundReward",
"03fe912b9260a268": "FundState",
"09c8a8302a9288ba": "FundStateMustBeUpdated",
"55c863af4f7d95dc": "FundWithdrawalBatchAccount",
"2492bcc3a50f54f0": "FundWithdrawalNotSupportedAsset",
"2c1d3dc53e8f530b": "FundWithdrawalReserveExhaustedSupportedAsset",
"8a6a505e8e7c6885": "FundWorthDecreasing",
"c4f028d94eb1afd7": "Fungible",
"000586fa60a86ec5": "FungibleAsset",
"62c622dbc52050e1": "Fusion",
"fecccf6219b51d43": "FusionPool",
"f53aaeab2c0ae030": "Future",
"d07d7b3441cea044": "FVC",
"1b5aa67d4a647912": "Game",
"cffaa30c2bcddaf2": "GameInstanceClosed",
"6a02c12d2197fdec": "GameInstanceCreated",
"a910f521ac7733d4": "GameInstanceRequest",
"89ea4acd4adae27b": "GameInstanceResult",
"85437587201d0889": "GameInstanceResulted",
"894915c69dee97f5": "GameInstanceRisk",
"1627e6a5b15a44ef": "GameInstanceState",
"e6227d68b87d0bf1": "GameInstanceUpdate",
"70d71ad30adf9d17": "GameIsCurrentlyPaused",
"da484c10d6495dbc": "GameNotStarted",
"006c5cb00ff4ad69": "GameSettled",
"4dec2c15102d5813": "GameSpec",
"01ad47d7a743540a": "GameSpecConfig",
"f25c7dbc471bd50e": "GameSpecInterval",
"fa52c0055d13b32f": "GameSpecStatus",
"7fa6675b85313bf5": "GameSpecToken",
"b122ab73c69fb6ee": "GameSpecTokenStatus",
"7b2204894a8d9a9d": "GameSpecType",
"905ed0acf8638678": "GameState",
"ef5dc2b7857925fe": "GameStatus",
"947f66e7db7fc1a4": "GameTotalOver",
"bc9f0a82a2ee1221": "GameTotalUnder",
"8f084fdb2c26b523": "GameUIDTooLong",
"c6fef72d3bfe156a": "GameUpdatedData",
"f29380b647288530": "Gamma",
"9daf2a3a7bd0efe9": "GammaSwap",
"4860c10e88fe11aa": "GammaSwapOptions",
"5267d93a9f80e015": "GasDropUnlockIsSufficient",
"5991bc7a37553f87": "GasGiant",
"5ce9541f81c82b43": "GasPriceUpdate",
"c3184ee4000e49cf": "Gatekeeper",
"9f8fb296d0abccab": "GatewayTokenInvalid",
"d18d2fdd2ec8ab12": "GatewayTooLong",
"6d2d569114e51f4f": "GeneATANotProvided",
"9ca36b3e82555b6a": "General",
"bc94a7a804dde522": "Generic",
"ec8d85456dbfb0be": "GenericExtraArgsV2",
"92793df933a12572": "GenericInvalid",
"2b9dd03a58387619": "GENESIS_BETA",
"62b7c1c925c50311": "GENESIS_DIFFICULTY",
"4f812fa1b68c00cf": "GENESIS_REWARD",
"2b1066908df79450": "GenesisAlpLimitReached",
"6311e669b71d248e": "GenesisCollectionNotVerified",
"e6a9dec83b843f5e": "GenesisIssueDelegatedDataCreditsArgsV0",
"543a219b57f87741": "GenesisLiquidity",
"0949a477dea693ef": "GenesisLock",
"131daca8cca97030": "GenesisLockCampaignFullySubscribed",
"f2b2a5217b0b9b97": "GetAddCollateralQuoteData",
"2cf3c90b474fadff": "GetClaimableStakeAccounts",
"a762b6d1dbcc4b66": "GetCurrentActiveEpochFailed",
"6b1701154131ca45": "GetFeeResult",
"ddfa2a866a22bea8": "GetLatestRegisterEpochFailed",
"4af19f017ac24811": "GetPriceResult",
"5a1a5250ebf65fdc": "GetStateResult",
"1739289b3dd24a2f": "GettingLessThanMinAmountToGet",
"64941e64db5e2891": "GetWithdrawStakeItems",
"a7e8e8b1c86c727f": "Global",
"95089ccaa0fcb0d9": "GlobalConfig",
"5e39c63bfa4a34a9": "GlobalConfigOption",
"c1cefdf5ac6275c6": "GlobalDepositBlocked",
"5867d495706ed388": "GlobalEmergencyMode",
"1149a572c09a6b2b": "GlobalInvestBlocked",
"547412a93337f8cf": "GloballyCursed",
"a32e4aa8d87b8562": "GlobalState",
"68b45bc2b22f881a": "GlobalVars",
"4f27f343664097ac": "GlobalVarsAuthInvalid",
"73d3c2e6e017f7f8": "GlobalVarsNotInitialized",
"fa6ddc9a5b1e6afc": "GlobalWithdrawBlocked",
"88ae9db3cb9b9cf3": "Glv",
"fe4da9c37ddacfdd": "GlvDeposit",
"2f77fe01253be3ed": "GlvDepositRemoved",
"d136235c23c0c9f0": "GlvDepositTokenAccounts",
"da5d059084a59363": "GlvMarketConfig",
"52b238e739b90d15": "GlvMarketFlagContainer",
"cb3791e13dcd40a5": "GlvMarkets",
"266d707df0e1fa84": "GlvMarketsEntry",
"3afd4522317ca2ca": "GlvNegativeMarketPoolValue",
"70acc07927802c1a": "GlvPricing",
"743d57845f1c9e74": "GlvPricingKind",
"f7717947e38f748f": "GlvShift",
"4172d185991078b3": "GlvShiftIntervalNotYetPassed",
"a39724b7de9ccaf4": "GlvShiftMaxPriceImpactExceeded",
"d7127c4051c50b47": "GlvShiftValueNotLargeEnough",
"fd951a67100be8c8": "GlvWithdrawal",
"4dedfe8a98b9cd7a": "GlvWithdrawalRemoved",
"517da5f89f4bcb78": "GlvWithdrawalTokenAccounts",
"13445f0134fa79f9": "GofxUnstaked",
"02e950b19114b3d1": "GofxVault",
"4f7f2d0823413020": "GoonFi",
"cf1d766077b304ee": "GooseFX",
"ffc6bedfbdb7fff9": "GooseFXV2",
"2154eaa23e7bf91f": "GossipDataInFuture",
"d5db02e9c47f3a67": "GossipDataInvalid",
"74bbfdc1a374514d": "GossipDataTooOld",
"68cb1554957b6ce7": "GoToABin",
"6e73c58e9d29c8f2": "GovernanceForAnotherChain",
"dd5ecaf6b1e15047": "Governo",
"25882c504455d5b2": "Governor",
"2d5c2da525682dba": "Gpu",
"39fe84376cfbea30": "GracePeriodCannotBeGreaterThanRentPeriod",
"d9d2d3349b689f1f": "Graduated",
"406621276eb8b5ba": "GraduationFeeRelativeToTargetIsTooHigh",
"0bf1a5ac7df544ed": "GrantManagerPrivileges",
"2432da22a9a43261": "GreaterThanOrEqual",
"d1f9d03fb659bafe": "Group",
"6c59de2d9516ee52": "GROUP_AUTHORITY_SEED",
"0fcf04a07f268ea2": "GroupAuthority",
"37d1aad0f94b4729": "GroupConfig",
"c9cc2af59c33d9bb": "GroupEventHeader",
"7012e11099a16f83": "GroupIds",
"657f6bb95b9935e8": "GroupNotFound",
"362dda38bea77763": "GT_MINT_SEED",
"16eefbab5df6c771": "GtBank",
"ccf2080996d06fdd": "GtBankFlagsContainer",
"21cb696c3df40a79": "GtBuyback",
"3b63d016db9141c7": "GtExchange",
"92766cee606b0d53": "GtExchangeFlagContainer",
"7be3aed610dbd694": "GtExchangeVault",
"99cae84c4f55db9c": "GtExchangeVaultFlagContainer",
"48f3a7a795db32da": "GtState",
"76e97b554c005c64": "GTStateHasBeenInitialized",
"ebb51a19fe3b738d": "GtUpdated",
"deb52b2ab47ef306": "GtUpdateKind",
"95e0b9b42254ebe3": "GuardianNotVerified",
"6d41e684b2070860": "GuardianReregisterAttempt",
"784d4a622253607d": "GuardianSet",
"70fb7855c3964f42": "GuardianSetUpdate",
"cbb8829d710eb853": "GuardianSignatures",
"6c96ca653baa90f5": "GuardianZeroAddress",
"a3ab837c6261d895": "GuardSet",
"f4fb7f4e982183ab": "GuardType",
"570d391962ea1a1b": "GumballMachine",
"7349cc180effa1cf": "GumballMachineDetailsFinalized",
"ae336b7baa4e0fd1": "GumballMachineEmpty",
"342ba10ca5805611": "GumballSettings",
"6295bc15dbfeff7d": "GumballState",
"306c0830130b935b": "HabitatCannotSpawnSeeds",
"cebdd7255cc09f96": "HabitatData",
"f044d264a4df6e07": "HabitatFullyDecayed",
"e953ecced1dbd239": "HabitatHibernating",
"ddcfba68dfbff371": "HabitatIsMaxLevel",
"13e9479c62eb977a": "HabitatIsNotASubHabitat",
"92e40a2fbbb79ea3": "HabitatMasterSettings",
"d36175c31a5fcc0e": "HabitatNotDecayed",
"be317c5c86e952db": "HabitatNotHibernating",
"fc5b60343ad3e20e": "HabitatNotYetUnlocked",
"53f7f24a9abab0eb": "HadoMarket",
"14c3f3bb2dde0372": "HadoMarketRegistry",
"df6c76a26168a4fa": "HalfLoss",
"230e3a8027d65f82": "HalfWin",
"9f9e929208bc1a2f": "HangarUpgradeNotPossible",
"9c4c235ec0d0b5ea": "HardcapExceeded",
"437a91a36991f8d8": "HarvesterSlotNotOpen",
"fcd05626bf0fffa7": "HarvestLiquidationGainsBlocked",
"0cd0fb0d9fdb3720": "HarvestReward",
"2bf9234c01ec2b86": "HarvestRewardCommand",
"e2fa114c5da56e9c": "HarvestRewardCommandResult",
"817c180e65ed01f5": "HarvestRewardCommandState",
"db3006bd6b9becaa": "Hash",
"c56d2e767fef7e32": "HashedAssetV1",
"e48407f9ed9c46b6": "HashflowChainMetadata",
"19635168ceeb33af": "HashNotComputed",
"87b76576c311bab0": "HasInitialized",
"a24513b3e2033626": "HasReward",
"2e1e2ccc9819d468": "HaveMoneyInLending",
"ca614e95672df0f1": "HBB",
"e9215280c3f66c91": "HbbMint",
"a1c4e687627a773f": "HDG",
"3260b83a06ff8f89": "Header",
"fce5d63a65763534": "HEADER_SIZE",
"c4f34555af5719d6": "HealthCache",
"f41e1dc4a9460244": "Healthy",
"ca4523c16e84bd6b": "HealthyAccount",
"89b23d52966413a2": "HeapMemoryCheckFailed",
"47fc82ec97f2480b": "Hearts",
"cb9319540809b837": "HeliumTreasuryManagementRedeemV0",
"d786b0e6147d1cf4": "Hidden",
"1ca47f477eaeaa98": "HiddenSettings",
"6650a4a504048585": "HiddenSettingsDoNotHaveConfigLines",
"8987b24de4aa5b20": "High",
"f6eb1cc8d45683e0": "HighLeverage",
"03c45abdc140e4ea": "HighLeverageModeConfig",
"70e551930c79ca73": "HighlySpeculative",
"57b6f0318f5b737d": "HighWaterMark",
"aeded6bc7f5613d9": "HistoricalIndexData",
"df713bfba985e050": "HistoricalOracleData",
"6b7b88a618733f9c": "Hit",
"db52734a51137c07": "HOST_FEE_BPS",
"ee34841466497322": "HotBlue",
"5a14d2e4d9cce259": "HourCursor",
"3f2c30f78b0bf2b4": "HourLimitSet",
"1630b6284fd69a3c": "Hourly",
"15915e6dfec7d297": "House",
"046e7d3288670c1b": "HouseAdvantageTooHigh",
"00f174833d8f1f6b": "HouseOracleList",
"616f343f59825a94": "HouseStatus",
"951243f1b6e904a7": "HouseToken",
"1b4c17535da1e3dd": "HouseTokenBank",
"4d8c3da7699da90e": "HouseTokenStateUpdate",
"c4cf2455c66aa081": "HouseTokenStatus",
"42568cb34d5ee0f4": "HouseUpdatedData",
"8fbd0478a9ea0e7d": "Hub",
"3cf80c6ab7c5d12b": "HubCollaborator",
"206de3f895921004": "HubCollaboratorCannotAddCollaborator",
"7ff82bf1dd130e6c": "HubCollaboratorCannotAddReleaseToHubAllowanceUsed",
"35c02b3679b04626": "HubCollaboratorCannotInitPost",
"4324e75914ba27b4": "HubCollaboratorCannotRemoveAuthorityFromHub",
"39315d9a5b23d674": "HubContent",
"b3752a947520a17e": "HubContentType",
"8bc4b6bb462e331a": "HubPost",
"fd29b741d4cdea80": "HubPublishFeeInvalidValue",
"007ab2851083e47a": "HubReferralFeeInvalidValue",
"37c9c47ae9b2ef4c": "HubRelease",
"15b01791332d35e5": "HubWithdrawAmountMustBeGreaterThanZero",
"86d2f2d261991574": "HubWithdrawAmountTooHigh",
"8abd24724cfa28de": "HumidiFi",
"46c6a60f00c44a3a": "HUNDRED_PCT_BPS",
"906249bd58f17135": "HundredthBasisPointsCalculation",
"3d36944e88fa7848": "HundredthBasisPointsParse",
"1535f96e90236dc0": "I80F48",
"acc93a94b5a6c89d": "IceGiant",
"bf404b555b14aee7": "IdenticalFeeOwner",
"b8c68f1e10b3d20f": "IdenticalFunder",
"44709632cd81305b": "IdenticalRewardDuration",
"76577d5539e2c4d8": "IdenticalSourceDestination",
"b2f0887a3e2fbfa1": "Idle",
"6db0e81cb1424834": "IdleToRespawnInput",
"d65428fb6b90adef": "IfRebalanceConfig",
"a9e5ba3eeaba9800": "IFWithdrawRequestInProgress",
"01791b3911273c58": "IFWithdrawRequestTooSmall",
"04b7453b894d7c7e": "Ignore",
"4910e87fe4813fc9": "IGNORED",
"39143333ae233804": "Img",
"ffc7710883f43c25": "Immediate",
"3ab49b55ccc5c19c": "ImmediateOrCancel",
"9b5db033679842c2": "ImmutableMetadata",
"83e351838377469c": "Impact",
"32eddbb036c338a0": "ImpossibleFill",
"5971dd6ee91deccc": "In",
"1fc159a1d883ffeb": "Inactive",
"65942f2258847633": "InactiveAccount",
"b4224f811ef093f7": "InactiveFeature",
"99bf1b25b4a19af6": "InactiveHabitat",
"657301c258798aa0": "InactivityVoid",
"a9644f8bf6dd2b31": "InactivityVoidRequest",
"da596a58512335ae": "InAmountsStackIsEmpty",
"3834470228d07cf7": "InboundRateLimit",
"9028d8364ecc1f98": "InboundXChainTradeReceipt",
"ed8dcc67bb7a395c": "InboxItem",
"efd0e8ca4a07ebfc": "InboxRateLimit",
"f08906de909d6815": "IncentiveEscrowProgramV0",
"c8e76abc1811a515": "IncludePnl",
"8a0f5f1bc3eee13d": "Inclusive",
"6fe25a60ccf67962": "Incomplete",
"a8bf0f5256c3873a": "InconsistentElevationGroup",
"eed9a93e8f12e3dd": "InconsistentIntegratorFeeConfig",
"b6c9cbe0de8f33d7": "InconsistentIxnBetCount",
"269a206f504f0a43": "InconsistentNativeDstTrait",
"917d51f9520019b1": "InconsistentNativeSrcTrait",
"db3629ca94fe9827": "InconsistentNumberOfAllocatedAccountsUndelegated",
"a4b09ba49d9864f8": "InconsistentProtocolFeeConfig",
"2c6a82f385566fdf": "Increase",
"0d99790779a1d972": "IncreaseObservation",
"17d025d5ffc2e4c1": "IncreasePosition",
"36af6c691776f9dd": "IncreasePositionLength",
"ab05027e538a6169": "IncreasePositionReport",
"42eaf8f625f3cb42": "IncreaseSize",
"72631e9ae21d1b22": "IncreaseSizeLog",
"17bd6cf46c50eed5": "IncreaseSizeLogV2",
"4643535899053d39": "IncreaseSizeLogV3",
"5787dd24025f9677": "IncreaseSizeLogV4",
"aa9b60357b86680d": "Increasing",
"0690e2b90858c3e2": "IncrementLevelInput",
"50ae6f163f66e6c2": "IncrementPointsInput",
"86cae033fe527722": "IncrementTooLarge",
"4096f80f89c3bc43": "IndexedAmount",
"934756dbd0e2a6ab": "IndexedPercent",
"c7b3e5f8b5522ca0": "Indexer",
"9b0bb676013c2fc0": "IndexerActiveOO",
"120b7bef83f1f6e2": "IndexGreaterThanLength",
"85e8a82fd8318f03": "IndexOutOfBounds",
"7dde7bf5250d25f5": "IndexOutOfBoundsException",
"62c9a61add9219ba": "IndirectInvocation",
"2da04dafd5a1025a": "IndividualDepositingCapIsZero",
"e360026083e00568": "Infinite",
"3ca4cbe4416fa783": "InFlowsSuspended",
"1743a37f763f5d98": "IngredientIndexInput",
"4c45f3c5d5a49af3": "IngredientNotAConsumableInput",
"43943e350cffe4da": "IngredientNotAnInput",
"7130fb4f87c6e7c2": "IngredientNotANonConsumableInput",
"a1267aa9e3d42a5b": "IngredientNotAnOutput",
"93d15e857ac7a5ca": "Init",
"05abbbf16bcd115d": "InitBumps",
"e66bb20ed911399b": "InitCargoTypeFromOldCargoTypeInput",
"3201d815c897e957": "InitCargoTypeInput",
"5c37e6f0605ef8e9": "InitCompounding",
"8a9fc9d04d866a3f": "InitDefinitionInput",
"352df03efb4f4018": "InitEntityClaimCronArgsV0",
"7902ca631889a400": "InitGameStateInput",
"95cea8e7832f34b9": "Initial",
"0ce8ffa2cc9615d4": "InitialAccountingIncorrect",
"c82756921108b0b3": "InitialDebt",
"83f6a724e8f9cf8e": "Initialize",
"f2a24b20fb90953a": "InitializeAccountWindowedBreakerArgsV0",
"e428bfadffe15d1c": "InitializeCarrierArgsV0",
"d493c7d9ec587482": "InitializeCommand",
"6ce95709aa4b083a": "InitializeCommandRestakingVaultDelegationUpdateItem",
"e33c9fb94ca603be": "InitializeCommandResult",
"15fe4541aab40d4f": "InitializeCommandResultRestakingVaultDelegationUpdate",
"10e09b79db139c79": "InitializeCommandResultRestakingVaultUpdated",
"3259ff0e4822df01": "InitializeCommandResultWrappedTokenHolderUpdate",
"eace94475a159f69": "InitializeCommandResultWrappedTokenUpdated",
"05002a06e65425bf": "InitializeCommandState",
"0687e21c8ebd422f": "InitializeCompressionRecipientArgsV0",
"b082cc4517b2c5e1": "InitializeCronJobArgsV0",
"46b614a169d28f08": "InitializeCustomizablePoolParameters",
"061b519d3e238806": "Initialized",
"62dbc66f89f1a437": "InitializeDaoArgsV0",
"c4e94b0f7c3b4282": "InitializeData",
"04b191851816a8c4": "InitializeDataCreditsArgsV0",
"95a58c8f7701fbe9": "InitializeDataOnlyArgsV0",
"3ac5178dbf478bc2": "InitializeDefaultPlayer",
"0af79c3283bf470e": "InitializeDefaultTeam",
"e3327615a1761862": "InitializeIncentiveProgramArgsV0",
"c53ba1bb9675ab14": "InitializeLazyDistributorArgsV0",
"86a9b55d75d715ba": "InitializeMakerArgsV0",
"9a7d97adc1967df3": "InitializeMintWindowedBreakerArgsV0",
"8f628651d7833468": "InitializePoolParameters",
"b502f4dee6a299b4": "InitializePriceOracleArgsV0",
"2b8915a08b370ffe": "InitializeReward",
"bb2003334eb075b3": "InitializeRewardableEntityConfigArgsV0",
"199c8999d285d0e5": "InitializeRewardParam",
"dbeaa22a844be62f": "InitializeStakeTokenPool",
"0e84e0acbc5db06f": "InitializeStakeVoucherPool",
"fdccb8bb3d1d1a3d": "InitializeSubDaoArgsV0",
"43cca5f795700da7": "InitializeSubscriberArgsV0",
"287a1c5a9fdf343b": "InitializeTaskQueueArgsV0",
"f88bb3bc8c417ce1": "InitializeTuktukConfigArgsV0",
"76dae4c64384733b": "InitializeVault",
"64217ece4056390e": "InitializeVoucher",
"e8b43189d4b7c821": "Initializing",
"5ed2536837980416": "Initiate",
"5fc56002f9becead": "InitiatorType",
"3ba6f2fbb0157719": "InitLpAmountTooLess",
"def00bf321cf8cb4": "InitPermissionPairIx",
"d5f08063b7dde3e4": "InitPolicyArg",
"6dec5a094c108701": "InitPresetParameters2Ix",
"2b9a77ba95484f50": "InitPresetParametersIx",
"3f2fa0b534bc4d9d": "InitRevenueTokenAccount",
"6d328c238b8a58dc": "InitStaking",
"b18d5bc83246d0bb": "InitSubAccount",
"f8e4742bad5e6ab7": "InitTokenVault",
"5211f55a8d398c08": "InitVirtualStablePairData",
"bf5c479023abfd59": "Inner",
"23ba1ed83dc0c8ea": "InnerNode",
"918a5d0b47a81ddf": "InplayDelay",
"251420aa80f1435b": "InplayTransitionMarketMatchingQueueIsNotEmpty",
"de3ddcf6bced09e9": "InProgress",
"5fdd9ea30c0de2d1": "InputAmountIsZero",
"3f020ff0172947d0": "InputElementsEmpty",
"2956b3cb349328ff": "InputMerkleTreeIndicesNotInOrder",
"e228ef5c6fe4f11d": "InputNotMatchCurveConfig",
"89f94039b8d56292": "InputNotSupplied",
"ec6dfa4a2a75944d": "InputTokenDataWithContext",
"96185b3f6b30ea3e": "InputTooBig",
"b98667c918e9cc07": "InputTooSmall",
"0c89e679ac7e3aaf": "InsolventCloseStep",
"99a47d20ec88b33d": "InstanceAccountNotEmpty",
"92723b1c70756fae": "InstanceActiveWindowEnded",
"d267c8e6f32bb120": "InstanceIdxOutOfOrder",
"57099965bdce6644": "InstanceIsntDelegated",
"1880a4cf674eac7f": "InstanceMulti",
"bfe52f62a3789593": "InstanceSolo",
"cf847f23635f14b0": "InstanceStatus",
"4db772b9829bc2df": "InstanceTokenMulti",
"99a3b616697211d3": "InstantUnstakeComponents",
"61d20c65e511f8f5": "InstantUnstakeComponentsV2",
"12690f19efff672f": "InstantUnstakeDetails",
"9eb6584ef9f9a8ad": "InstantUnstakeNotReady",
"563098891498b304": "InstantUnwrapFeeBasisPointsTooHigh",
"826db2e8dd00d403": "InstructionAtWrongIndex",
"761cfab669869cdf": "InstructionBuilderFailed",
"a8c6f3070d2a18e3": "InstructionBumps",
"d60cb529fba04742": "InstructionDataInvoke",
"4d4e38ff2a3bb366": "InstructionDataInvokeCpi",
"60eb48ff7eb6fb5e": "InstructionIsCPI",
"a2cc8825414fd95c": "InstructionIsNotSupported",
"9a4ba380807feeb2": "InstructionNotCallable",
"1fb2db5504e2e51f": "InstructionNotFound",
"ec7e789bb2fd9196": "Insurance",
"34bd5f4975eba0e6": "InsuranceClaim",
"2b86aa5766108e93": "InsuranceFund",
"9eb6ed0f6defed43": "InsuranceFundOperation",
"6bae8041f5f58ee3": "InsuranceFundOperationPaused",
"44c8a072872ece8d": "InsuranceFundRecord",
"6eca0e2a5f495a5f": "InsuranceFundStake",
"ec830a0ba4f4deff": "InsuranceFundStakeRecord",
"0b15718bb631fa7e": "InsuranceFundSwapRecord",
"2cdee8a58f179441": "IntegrityPool",
"35e2dcbd2c3254c4": "InterestAccrualBehind",
"3290f23264c95826": "InterestRateConfig",
"dbb04deb7a97cd9d": "InterestRateConfigCompact",
"3ff60a73dbf4d1c9": "InterestRateConfigOpt",
"a8f9eb719ed17c9e": "InterestRateIsOutOfRange",
"80d47f3601f9a154": "IntermediateAccountNotSet",
"c65945e3f01038e9": "Internal",
"40c726ad98b40cd7": "InternalErrorBadLockupVoteWeight",
"2ec177a53bee0bfa": "IntervalLimitsAreIncorrect",
"aa01dae561719e94": "InThreshold",
"0525584dcc576baa": "IntoPool",
"d5cfebb0b1c4e730": "Invalid",
"7ad6039570cecb80": "Invariant",
"d0249300ae365f36": "InvariantDecreased",
"63d75176ad6c6436": "InvestAmountBelowMinimum",
"bdfbcfe85423bca6": "InvestTooEarly",
"4cdf096421cde6e7": "InvestTooSoon",
"cec9e5846afb6ebf": "Invocation",
"28f3ecdd6360023f": "InvokingProgramNotProvided",
"acfb0b2275a5f3d1": "InWritingStatus",
"864cf0c4a1911c4e": "IotConfig",
"79d035f5c7a6f64f": "IotHotspotInfoV0",
"67a947c072b6533e": "Isolated",
"5c2d0ca04d8df9bd": "IsolatedAccountIllegalState",
"d8a8e034f29b5cb3": "IsolatedAssetTierViolation",
"c84ec955c3056b72": "IsolatedCollateral",
"12ae1664d569a391": "IsolatedDebt",
"ac35206a69e82407": "IsReferred",
"4ccd203ea9dbf26c": "IsReferrer",
"cb7c3fc6ae0ffd58": "IssuanceControl",
"0a9f92f82fd7daa2": "IssuancePerSecond",
"abc1cc3e3fa66aff": "Issue",
"3109c432cb90b0ed": "IssueCarrierNftArgsV0",
"818a3f044e1960b9": "IssueDataCreditsArgsV0",
"b5ea920e6ab29c95": "IssueDataOnlyEntityArgsV0",
"68dedf7615e96b29": "IssueEntityArgsV0",
"810d135eb7cd1225": "IssueMappingRewardsNftArgsV0",
"df74c469ef476ee1": "IssueProgramEntityArgsV0",
"71aa0802f1a7e6b6": "IssueRewardsArgsV0",
"3b58123aa5c19c27": "IsTokenPoolPda",
"931ba4a8b2acb119": "IxData",
"2b7bbca0246bbad1": "Jack",
"8c2e58b627551783": "Jackpot",
"26b2066183ca1406": "Jito",
"89a1d53b44ac7b88": "JitoRestaking",
"f6bece6dc5782a41": "JitoRestakingVault",
"14895683fd0a23c9": "Jlp",
"4b7c50cba1b4ca50": "Job",
"5b10a2052dd27d41": "JobAccount",
"4b6d7a4caa16b0ee": "JobInvalidProject",
"4615f3388fdbb197": "JobInvalidRunAccount",
"0de6830391d78b30": "JobInWrongState",
"5708e47d1105213f": "JobResultNull",
"5f68c4aafd434b02": "JobState",
"497a99cd20da89f7": "JobTimeoutNotGreater",
"38ac677eb055c5ea": "JobType",
"9d4bb4277dd98392": "JSOL",
"266f09382b8fd9b6": "JSOL_SOL",
"e76321dc2058d489": "Judged",
"4b11d60c6bb18337": "Judging",
"03d5fa8a5406b389": "JumpRateState",
"52a0985e00bb5774": "JUPITER_ACCOUNT_SEED",
"6397952beb141170": "JUPITER_SEED",
"d254710f5a13a5b6": "JUPITER_SWAP",
"b63b7d097fd1e803": "JupiterAccount",
"c8d2122c2d322466": "JupiterLpCompute",
"6fba817d489d6752": "JupiterLpFetch",
"ef06fceb4e8f6658": "JupiterLpScope",
"eaa6d142c7ed7057": "JupiterSwap",
"348a407d4ebc6ad0": "Kamino",
"a06f4678a658b5bf": "KaminoCollateralNotValid",
"1da8207478992d8a": "KaminoMarket",
"248ce047f5e9789a": "KaminoRewardExceedsAvailableAmount",
"9aa788b4b5ab348e": "KaminoRewardIndex0RewardPerSecond",
"e1e1f1f6be0d4b1c": "KaminoRewardIndex0TS",
"53b8115f0305e5f2": "KaminoRewardIndex1RewardPerSecond",
"b60bb3784a1dc776": "KaminoRewardIndex1TS",
"ce05db4423336a0b": "KaminoRewardIndex2RewardPerSecond",
"80cba7f2d170e854": "KaminoRewardIndex2TS",
"50dd8e892e723e2e": "KaminoRewardInfo",
"89b4063c4f480593": "KeepAccumulator",
"88b7ea4c8406f77d": "KeeperATAMissing",
"84f53fc00867f688": "KeeperNotTimeToFill",
"e5e0c967b58568d3": "KeeperShortchanged",
"a899d8bf79111e6d": "Keno",
"3e995931e785b512": "KenoMultipliers",
"c2e12bd16245df64": "Key",
"df4b66285490840c": "KeyIndexInput",
"26bacbb5bb90975d": "KeyIndexOutOfBounds",
"e8055db1c0ab4b17": "KeyMissingPermissions",
"ab7ddf733a23e6a7": "KeySerialization",
"ea28f4409aab1db1": "KeyToAssetV0",
"3586c4f43b1a863f": "King",
"1a9ae590519fba50": "KiNotYetUnlocked",
"7090d0c3ec786274": "KlendSupply",
"ad38625f9632cec7": "KSTSOLSOLORCA",
"77db1e73b2f922b0": "KToken",
"2f25565b53601f30": "KTokenToTokenA",
"ccb196cbb6f9ff33": "KTokenToTokenB",
"e97b958c3ca161ad": "KTokenUnderlyingPriceNotValid",
"4ad74ab9bf9a65c3": "KUSDCUSDTORCA",
"fb0e02af04736f0b": "KUSDHUSDCORCA",
"07b79a903301413c": "KUSHUSDCORCA",
"3b5997bb51ccaa98": "KUXDUSDCORCA",
"1b0305dfa31525c9": "Kyc",
"bde608e438162d19": "KycLite",
"492fb5c9add14807": "KycStatus",
"2dfc04295f630863": "LaineSOL",
"c4555dfeb58dffb8": "Large",
"0196633b056a1f51": "LargeBitMask",
"c8bf3e81a86a72e9": "LastFreeNode",
"60c773e41fe9a434": "LastTimestampGreaterThanCurrent",
"1d5837a5911b3c63": "LastUpdate",
"89ee945054be5589": "LastUser",
"6c43caccf548b1e2": "LatestConfig",
"a4667267a50888c5": "LatestRoundData",
"679d2b61a8b5d735": "LaunchStage",
"f088dcf6a021eafd": "LaunchStagesInfo",
"e4c1e79d581238b3": "LaunchStagesOutOfTimeOrder",
"a1dd9ec78d7f9338": "LaunchStageStartAfterEnd",
"7ab910effd98713e": "LaunchStageType",
"85222b0a11f1c064": "LayoutVersion",
"87bab9fc0a4d63a7": "LazyDistributorV0",
"210b3162b565b10d": "LbPair",
"e02542643f965fb7": "LbPairCreate",
"9db5a2c4fa59366f": "LDO",
"614388016913ec77": "LeafAuthorityMustSign",
"4771b41b88761111": "LeafNode",
"ebc05aa4f9af9d84": "LeafNotFound",
"0d2ccdcd270a5b65": "LeafSchema",
"85c80110f0871dc0": "LeaveTeam",
"4f45917c1e756360": "LedgerBase",
"91786cb26f6d6b87": "LedgerBridgeInitialized",
"325b40961a653abe": "LedgerMode",
"ae8e005d5b7a041d": "LedgerOrderInitialized",
"2166454e553739ac": "LeftoverHasBeenWithdraw",
"245f8ba8469d20a4": "LeftoversExceeded",
"d8480595a202642b": "Legacy",
"a69a20072ec580e8": "LegacyEmitter",
"5c2b52c4a5e31e9f": "LegacyEmitterSequence",
"0a6482d09e8f0ec4": "LegacyInstruction",
"4688dc13a1201968": "LegConsumedLamports",
"00d727637d6ba2d1": "LegConsumedOutput",
"1a11b20d23dbdbfb": "LegInputOverconsumption",
"9edb4f9727c9d31c": "LegitimizeRecipeIngredientInput",
"ddef6dea88a322de": "LenderRedemptionRecord",
"f076ebe212033a19": "LenderState",
"a1cef1eba73ddd2a": "LenderStateNotReadyToClose",
"e45e8251bbb6e655": "LendingAccount",
"201e7f0fea5b4ab1": "LendingAccountBalanceNotFound",
"8ec323b6c72436a1": "LendingAccountBalanceSlotsFull",
"6fab23b369461bb7": "LendingAssertionViolation",
"f6723262489d1c78": "LendingMarket",
"47669ce80efaf70b": "LendingMarketsMustMatch",
"2ffffc2314f59df3": "LendingPosition",
"874e6333db5f20b9": "LessThanExpected",
"3093ad31b4496344": "LessThanOrEqual",
"c12b9641751230d1": "LessTokenInFund",
"fabfa2e43f027945": "LetsBonkFun",
"5ae49fadd4a09bfa": "LeverageCheckType",
"7d549f41c8c0bdd1": "Leveragefi",
"8b943785a61763d0": "LeverageIsOutOfRange",
"ccb626ed7448230b": "LeverageTooHigh",
"5b99f75de09247b1": "Liabilities",
"bfe11753bc89ed39": "LiabilitiesBiggerThanAssets",
"1e47d36cc5117608": "LicenseType",
"528a2237af66a46e": "Lido",
"5afc2bb20811cb3d": "Lifinity",
"37514b64e2599d1b": "LifinityV1",
"ca3b9f4c76be73db": "LifinityV2",
"9d26f55e681b5d1e": "LifinityV2Swap",
"95fa92889e1b8eca": "LifinityV2SwapOptions",
"83bd5c9e9b325002": "Limbo",
"aca31408c5181006": "Limit",
"48e4222e1475ffa3": "LimitDecrease",
"bbad1da6791168ad": "LimitedString",
"fdb6e9ca03d603d6": "LimitIncrease",
"89b7d45b731d8de3": "LimitOrder",
"9d1ae12ad9cba21e": "LimitOrderBook",
"a5f40428b86a48f7": "LimitOrderExecutionFeeIsOutOfRange",
"694b9615d77e9784": "LimitSwap",
"f6bb76a0cd9f80bc": "Linear",
"203282c07e071540": "LinearCurve",
"73763637cb28ac6d": "LinearV1",
"bb5c4cc904fee728": "LineGraded",
"f45c0e1e55be7445": "LineNotGraded",
"b0d900bf9faec18c": "LinePaused",
"1c657634c0f7fb86": "LinkAvailableForPayment",
"70c67ad564c99508": "LiqPaused",
"12e67512f19233b9": "LiqPool",
"f8f677e7fdc69f23": "LiqPoolInitializeData",
"9fc4ef2863567ab7": "Liquidate",
"64fd0ab51dbb3057": "LIQUIDATE_THRESHOLD",
"bc8faa471c323232": "LiquidateBorrowForPerpPnl",
"319bc3e67861e46b": "LiquidateBorrowForPerpPnlRecord",
"bd554e43249879aa": "Liquidated",
"7ab514656ff7c88f": "LiquidateLog",
"84981023d28b023e": "LiquidateLogV2",
"00953ab011512e05": "LiquidateLogV3",
"a7429b7f70f693c4": "LiquidatePerp",
"422e258c64f276e0": "LiquidatePerpPnlForDeposit",
"5af01e24272a1483": "LiquidatePerpPnlForDepositRecord",
"ed50e63da78849ea": "LiquidatePerpRecord",
"594f549ad707d3fd": "LiquidateSpot",
"ea6b9215a7063737": "LiquidateSpotRecord",
"c2ddfd7dd9d2e9fe": "LiquidateTooMuch",
"b71407d1daf0205e": "Liquidating",
"2f56dbac83ae12e3": "Liquidation",
"356442ed54eef459": "LIQUIDATION_MAX_EQUITY_LOSS_CONSTANT",
"985b9a59d6138cad": "LIQUIDATION_MAX_EQUITY_LOSS_PROPORTION_BPS",
"67546e7affd5f17c": "LIQUIDATION_TIMEOUT",
"a88e73a50d792aad": "LiquidationBalances",
"2f6e39cb7842482d": "LiquidationBegun",
"448c16cc79aa8e94": "LiquidationBorrowFactorPriority",
"950156c87aab1363": "LiquidationDecision",
"80807cdb5bb27c6c": "LiquidationEnded",
"092835bf2e6a3239": "LiquidationFee",
"068f4c7a471da1b0": "LiquidationFeeIsOutOfRange",
"51600b06138aef40": "LiquidationFees",
"a8a9f2fd13c1f778": "LiquidationFeeSlotsFull",
"8570b06c4e77e29a": "LiquidationLostValue",
"cad52205c563dd77": "LiquidationLowestLiquidationLtvPriority",
"d4386a355155e38e": "LiquidationLowestLTVPriority",
"f7cc93e16063e878": "LiquidationMultiplierType",
"68729d84046c6c0e": "LiquidationOrderFailedToFill",
"5f74178459d2f5a2": "LiquidationRecord",
"df72d6c73c1e6d09": "LiquidationRewardTooSmall",
"e21b2eae6501d971": "LiquidationsBlockedByOracle",
"0414c9039adba851": "LiquidationsOngoing",
"e610f572888012c5": "LiquidationsQueue",
"5b414c43ca1d32e3": "LiquidationsQueueFull",
"330326af5d90ffac": "LiquidationState",
"533aad75961e9870": "LiquidationsVault",
"95a1d86ed6fc72c8": "LiquidationThresholdIsOutOfRange",
"b0a7ba69866a16ed": "LiquidationTooSmall",
"c63619ec7fab05e7": "LiquidationType",
"561ba7bf95dfa3ca": "LIQUIDATOR_CONFIG_SEED",
"1af38df14df694c7": "LiquidatorInvokeBegin",
"cdf4a26d842296f8": "LiquidatorInvokeEnd",
"36fcf9e289ac793a": "Liquidity",
"25d3cb9b065a0359": "LIQUIDITY_SEED",
"e969221ab636af47": "LiquidityAddTooSmall",
"01db516eccf3a26e": "LiquidityAddUnbalanced",
"9f74a794dbc8017b": "LiquidityAddValueErr",
"4c52130f119b953e": "LiquidityCalculationMode",
"12422a1cd9c4a60e": "LiquidityCapExceeded",
"f352bf2f161bf43c": "LiquidityDecreased",
"4034c99220e65a67": "LiquidityDistributionConfig",
"422f5082b7bf9560": "LiquidityDistributionParameters",
"cbd519cbe098d8dc": "LiquidityIncreased",
"d4d7d8d9a88ea8f2": "LiquidityIsCapped",
"584574d3a9ba28bd": "LiquidityLocked",
"48d26bbf501f44cc": "LiquidityOneSideParameter",
"cceb5b509804f7a9": "LiquidityParameter",
"164351339159dc6b": "LiquidityParameterByStrategy",
"16263b549e6ec7e6": "LiquidityParameterByStrategyOneSide",
"91ee1e84b01ff267": "LiquidityParameterByWeight",
"dbf1ee8538e1e5bf": "LiquidityProvider",
"8fbcf5c5866ae460": "LiquidityProvision",
"08fdc16ae4af9862": "LiquidityProvisioned",
"a629bd6cf7bb40ba": "LiquidityProvisionOrder",
"fbce78ed66b8ce2b": "LiquidityProvisionOrderIsNotCorrectOrderForPair",
"434bc35931e3d561": "LiquidityProvisionOrderIsWithdrawn",
"1c5fed85e8afdeff": "LiquidityProvisionOrderNotEdge",
"76b204c37cbf9e90": "LiquiditySource",
"2cecc234d4982bc5": "LiquiditySubValueErr",
"9558135a08e96a8f": "LiquidityTargetTooLow",
"a08cdcbf892a61c8": "LiquidityTooHigh",
"e6afd6f7ebddf317": "LiquidityUpdated",
"124784f3cd114a5a": "LiquidityUpdatedData",
"abc1ab97a8e24dd0": "LiquidityZero",
"ba8ba7fc82ae76ad": "LiquidStake",
"a918ba6e168bbe52": "List",
"e4f373790a989be1": "LIST_STATE_SIZE",
"bedc9af4274ca738": "ListedLoan",
"4caff4824a9bce0f": "ListIndexOutOfBounds",
"4ef2598aa1ddb04b": "ListState",
"60ee9c77619834df": "Lite",
"b89bdff5873624b5": "Live",
"0160da8572d0ccd7": "LIVE",
"b50619402b9058f9": "LiveRound",
"4756a67bd466a375": "LM",
"52bcd39999778ec8": "LoadInstructionAtFailed",
"14c34675a5e3b601": "Loan",
"aed625e5b028d976": "LOAN_DECIMALS_LIST",
"b504fac316e53470": "LOAN_LIST",
"8556a642b5cc98b8": "LOAN_ORACLE_LIST",
"1af069bf5b513278": "LoanActive",
"306c99d38527d60f": "LoanCancelled",
"a5ca17d72f0ef57c": "LoanDefaulted",
"c4e079d057acd1e5": "LoanDetail",
"c5a7d592515b32bf": "LoanInactive",
"a9f425c2059eeade": "LoanNotAvailable",
"4f32d335d6de87e6": "LoanNotOpen",
"947f459a3fdd1d4e": "LoanStatus",
"2e560acb75b1d4f8": "LoanTerms",
"525e49be9dc3ae03": "LoanToValueFilterOutOfBound",
"49d596f4a31cd66e": "LoanTransferred",
"54daac2ba924a08d": "LoanUpdate",
"9f833aaac15480b6": "LocalToken",
"ed8f72cc05159022": "LocalTokenAdded",
"26899b77002636f2": "LocalTokenRemoved",
"bd71c1d662a7a304": "LocationType",
"197267e166e46135": "LocationTypeNotSupported",
"08ff24cad2163989": "Lock",
"8ab27fbca87192f1": "LockBuilderFailed",
"6a2fee9f7c0ca0c0": "LockConfig",
"216b28e9d4f900c2": "LockDurationInvalid",
"5d17ef188ff9277b": "Locked",
"3d0f3e12e33a469c": "LOCKED",
"34170507aa5a6cd5": "LockedClmmPositionState",
"190aeec5cfea4916": "LockedCpLiquidityState",
"f847346772e93a13": "LockedFee",
"48486664c9f0d18b": "LockedHabitat",
"29411ecc7ca613f0": "LockedKi",
"ebf0eb95b0368c4c": "LockedProfitState",
"e07e1b28149c3864": "LockedProfitTracker",
"8bbd8b2908236b96": "LockedStake",
"7c29588243091d5e": "LockedStakeArrayFull",
"b33f7cc538f8b7cd": "LockedVestingConfig",
"4af60671f9e44ba9": "Locker",
"5294e46884906581": "LockerHistory",
"80f5ee8ae230d83f": "LockerWhitelistEntry",
"be6a7906c8b6154b": "LockEscrow",
"44c2d3f83e00f277": "Locking",
"beaf41077f228e89": "LockingDuration",
"3bf537abd1dec070": "LockingEarlyWithdrawalPenaltyBps",
"eb8dc07ab91a0046": "LockingInfo",
"3a1da53bcc011709": "LockingMode",
"7314c3f8f1e5372e": "LockingStartTimestamp",
"8b5e3618144b8b35": "LockTimeInvalid",
"1b560da82a26279e": "LockType",
"707980b82966b894": "LockTypeLabel",
"012d202039515843": "Lockup",
"54aa476a51ee1b90": "LockupDurationTooLong",
"4778ec46f463ebc2": "LockupDurationTooShort",
"4f7da1dfbd87bc7e": "LockupKind",
"0b48a063391d6e9b": "LockupSaturationMustBePositive",
"e35b9b96a8a86683": "LOK",
"524d33fdad2a9b7c": "Long",
"53529ff2bb6e0c31": "LookupTable",
"8558bb8d013548ec": "LookupTableLink",
"68bb5e21e7b9c321": "Loose",
"264aae7be220d101": "Lose",
"b8cc16b94b525f28": "Loss",
"deb2bcc8f660975a": "LOTTERY",
"58b4b3cd8d2f8ad7": "LotteryPoolIsEmpty",
"978ccada4513e345": "Low",
"96248f41df1ef89e": "LowerHeuristic",
"7d264c970b5a7d5f": "LowerTickLargerThanUpperTick",
"17894f4b41ab982a": "LowerTickNotMultipleOfTickSpacing",
"61c137bbcc504840": "LowerTickTooLow",
"5c3d489f512d49cf": "LowestLtvAssetsPriority",
"9a2d53f2643928cb": "LowHigh",
"7a44613556edd0e8": "LP",
"2ba253869cad6271": "LP_TOKEN_PROGRAM",
"53fb2e0a77a8d076": "LPAction",
"ca140663ede04b43": "LPConfig",
"e44cdd8a9ccb438b": "LpDeposit",
"8effdcb08d58be7a": "LpFeesAreWrongWayRound",
"44ff2a2cbec11094": "LpInteraction",
"e0c98900f51daeb9": "LpMaxFeeIsTooHigh",
"b6f004f249fb5bc1": "LpOf",
"b62fb7347dc82d1e": "LpOrderState",
"abdfbe52063fb8d4": "LPOwned",
"bb388f875afe4395": "LPRecord",
"eb50861df61db476": "LpWithdraw",
"1bb92d1460e92181": "LRTOracle",
"bb2bad73605579b3": "LRTPool",
"80d9d019eaf2a2b0": "Lst",
"4683e939089a72a7": "LtvTerms",
"dc693689f7af9f1f": "LzAccount",
"7d51110aa4f58e80": "LzMessage",
"37e913627bac5911": "LzOption",
"f857a77505fb157e": "LzReceiveTypesAccounts",
"0626a1c9312058f6": "LzTokenTreasury",
"dd85f91b95a158e1": "LzTokenUnavailable",
"67ad5d1a54893860": "Main",
"4d24490998eebe3d": "MainSlip",
"c248395f27c6411a": "Maintenance",
"cdbe17fd934a8e66": "MainTokenMint",
"1fffe83d261cbd93": "Maker",
"f17150d6b0917236": "MAKER_BROKER_PCT",
"71495a5668f1dc69": "MAKER_REBATE_BPS",
"20e47c1713848e5b": "MakerApprovalV0",
"0d43a00c689c6334": "MakerBrokerNotYetEnabled",
"8f5008fe8850e049": "MakerBrokerNotYetWhitelisted",
"c9075e853edc4550": "MakerCantFulfillOwnOrder",
"7170445b68908ebf": "MakerMustBeWritable",
"b169c77b9012cae1": "MakerNotFound",
"985601a0cf16adb2": "MakerOrderMustBePostOnly",
"b6115fff98564501": "MakerOrderNotFound",
"2fee4ee8871a7298": "MakerStatsMustBeWritable",
"d1fd528f6442e23a": "MakerStatsNotFound",
"61c46792b02147eb": "MakerV0",
"7453550374e1959a": "MalformedMessage",
"e9b81fa824721c72": "ManageGameInput",
"0508c120f018064c": "ManagementFeeBps",
"e24369e4cc0a341f": "ManagementFeeGreaterThanMaxAllowed",
"dd4eabe9d58e7138": "Manager",
"59b98c5a03af99b8": "ManagerNotFound",
"9c5ec71d377fca40": "Mango",
"701e62615af73589": "MangoIsNotSupportedAnymore",
"b7feb752b5f48b39": "MangoSupply",
"8b37bfb40a656428": "Manifest",
"6e0392602eecf0cb": "Manual",
"9ceb220f00d39525": "ManualRebalanceInvalidOwner",
"b036a2b2eac24332": "MarcoPolo",
"98118ec350c4a130": "Margin",
"18a3376c85225080": "MARGIN_ACCOUNT_SEED",
"f477a06ae0f76538": "MARGIN_SIZE",
"85dcadd5b3d32bee": "MarginAccount",
"4f046d2f8b78fc87": "MarginBorrow",
"6241919379ebdd5d": "MarginCalc",
"60dec72ea0fdb259": "MarginCalculationMode",
"ad89542d5ea8e195": "Marginfi",
"7f57f94227ceadca": "MarginFi",
"43b2826d7e721c2a": "MarginfiAccount",
"b617adf097ceb643": "MarginfiGroup",
"0240a4bc4749ee5b": "MarginfiSupply",
"7c29d6be24c6562e": "MarginInUse",
"aebc5fc5a42344fd": "MarginMode",
"d370eae7f3ee952e": "MarginOrdersOpen",
"8eff1c20c4a8aaaf": "MarginPool",
"e280c123a4e12348": "MarginPoolConfig",
"f3fb65a947494307": "MarginPoolSummary",
"bb96f3bc655c936c": "MarginRepay",
"88dd415e3abe7b39": "MarginRequirementType",
"7dc3012689c0c95a": "MarginTradingDisabled",
"3bc54ac75aa5712f": "Marinade",
"6f948edb8a0ad3f9": "MarinadeDeposit",
"9ec8833f4cfdf53b": "MarinadeStakePool",
"737f1a23336e4045": "MarinadeUnstake",
"dbbed53700e3c69a": "Market",
"c94ebbe1f0c6c9fb": "MarketAccount",
"cf6861981cc79965": "MarketAccountIsNotProvided",
"da67ea0aacb77413": "MarketActionPaused",
"f3ea26a5a345f316": "MarketAuthorityIncorrect",
"7ee9f11e43a3b043": "MarketBeingInitialized",
"dcf88daab3894e70": "MarketCapThresholdTooLow",
"b4bccd5aa706db31": "MarketCapTooHigh",
"38aef5f6be495394": "MarketCollateralAmounts",
"77ffc858fc528018": "MarketConfig",
"a9b0beb88ca86aa0": "MarketConfigBuffer",
"61ff853bac400569": "MarketConfigFlagContainer",
"5a28f26d963612ac": "MarketData",
"368be0cac8302bdd": "MarketDeactivated",
"9439c2acbc7dfcc8": "MarketDebtLimitExceeded",
"4fe79ceedf1fedca": "MarketDecrease",
"d8c7fd98ca1af125": "MarketDelisted",
"37bd117fcabd66d5": "MarketDisabled",
"4641789db43b2813": "MarketEventNotStarted",
"e195ac6cb2efe841": "MarketEventStartTimeNotInTheFuture",
"0c2321055ce7f857": "MarketFeesUpdated",
"40f23f0765ddb51a": "MarketFillOrderPaused",
"d3dc15763920d875": "MarketFlagContainer",
"8012f5741de9960e": "MarketIdentifier",
"55ae37c37820d1c0": "MarketIncrease",
"f628a53605184e27": "MarketInplayNotEnabled",
"44c2fe05eaab9876": "MarketInvalidStatus",
"18c9722f355e9b31": "MarketInWrongState",
"f105987836e26998": "MarketIsPaused",
"09b8bf5c765b7b78": "MarketLiquidities",
"3e856800964a471a": "MarketLiquiditiesCrossMatchingDisabled",
"1cff67698c8c140b": "MarketLiquiditiesIsFull",
"9a7993bcff5d3305": "MarketLiquiditiesSourceLiquiditiesInvalid",
"7c3dcec9e0103268": "MarketLocked",
"d76c9e963a54d6a7": "MarketLockTimeAfterEventStartTime",
"86bfb91422de7230": "MarketLockTimeNotInTheFuture",
"977b283a44d36838": "MarketMaker",
"ff12dc8c77fef4f5": "MarketMatchingPool",
"3ce233ca77d61f1a": "MarketMatchingQueue",
"5f92cde798cd97b7": "MarketMeta",
"5ae0d3fcc67aa39c": "MarketMetaDataLog",
"f2fb6a43233df4ab": "MarketNotOpen",
"1599ed80a7df708e": "MarketNotOpenForInplay",
"65a44ac1c6e0e5dd": "MarketNotReadyToClose",
"66b1fc4ca82e8a33": "MarketNotSettledOrVoided",
"0db2ce2b00deb087": "MarketOrderBehaviour",
"dda6bf007a34d57e": "MarketOrderFilledToLimitPrice",
"bb1c59805ad8ec8e": "MarketOrderRequestQueue",
"830c223473893e72": "MarketOutcome",
"70f547966c2f81b3": "MarketOutcomeMarketInvalidStatus",
"fd557e53d434b295": "MarketOutcomePriceLiquidity",
"d1ff93bdf5e54210": "MarketOutcomeTitleTooLong",
"17a16fbb95004218": "MarketPaymentsQueue",
"93da32f213f33e22": "MarketPermissions",
"531759fadcfc9e2a": "MarketPlaceOrderPaused",
"880ce113e794c286": "MarketPosition",
"2fd26fe0b5a505fc": "MarketPriceListIsFull",
"163eb34750bfcbd0": "MarketPriceOneOrLess",
"6ab91ae6163f418a": "MarketSettlementAttemptOnActiveMarket",
"6e32de3c62b2f7ad": "MarketSettlementAttemptTooEarly",
"0ebfbc48ebadb57f": "MarketSettlementRequiresSettledLP",
"7df79b1cd452ed6e": "MarketSettlementTargetPriceInvalid",
"007d7bd75f60a4c2": "MarketState",
"6f81caef5fcf939c": "MarketStateUpdated",
"652b7fc964ddd0bc": "MarketStatus",
"be467e2ef69840e1": "MarketStatusInvalidForNewLP",
"f60ecfc9d04b36d2": "MarketSwap",
"475f840f186a7508": "MarketTitleTooLong",
"694578a376bbbc51": "MarketTooManyOutcomes",
"1c8c91fbbf6636d8": "MarketTrustType",
"e118fd426905ca29": "MarketType",
"a1986f7d20c87f03": "MarketTypeDiscriminatorContainsSeedSeparator",
"5e346579e3eeffe0": "MarketTypeDiscriminatorUsageIncorrect",
"8805bf6bcd990e60": "MarketTypeInvalid",
"e80832066e7f6a72": "MarketTypeNameTooLong",
"1b6eb80efc6f412e": "MarketTypeValueUsageIncorrect",
"b74fe7c4e57784fd": "MarketUnclosedAccountsCountNonZero",
"343454cbd90b4b36": "MarketUnliquidatable",
"5c922112f0620cbe": "MarketUnsettledAccountsCountNonZero",
"b5c86f487f5256d4": "MarketUnsettledCountDecreaseWithNonZeroEscrow",
"ff8e86193801db7c": "MarketVars",
"e8433db3fc9da951": "MarketWithdrawPaused",
"5eecc2da6235b658": "MarketWrongMutability",
"3a68d77db13674e1": "MasterEdition",
"4c2e097aa0a8104c": "MasterOrganization",
"ec3fa9260f38c4a2": "Match",
"badab61a50fddc21": "Matched",
"ad4274bf6b4b27fb": "MatchingExpectedAForOrder",
"c2cf2bd7509887d2": "MatchingExpectedAnAgainstOrder",
"4744478c17438585": "MatchingMarketInplayNotEnabled",
"8ca4653dc2850e56": "MatchingMarketInvalidStatus",
"1b01f60de642c7d7": "MatchingMarketNotYetInplay",
"ee573c6a38bb11b0": "MatchingOrdersForAndAgainstAreIdentical",
"3da29926d0147a1c": "MatchingPoolIsEmpty",
"dade5b5368bad7c1": "MatchingQueue",
"eb2af2540abe3cca": "MatchingQueueHeadNotMaker",
"c161c37f559aae26": "MatchingQueueHeadNotTaker",
"433fb629f4a76001": "MatchingQueueIsEmpty",
"09569b8955c5a74e": "MatchingQueueIsFull",
"01064a9ec343b98c": "MatchingQueueIsNotEmpty",
"6bd0fd1bc834e67d": "MatchingRemainingLiquidityTooSmall",
"50709851eeb8f78e": "MatchingRemainingStakeTooSmall",
"2417c80dd9c8dfdf": "MatchingStatusClosed",
"07487cb59d73b2c9": "MathErrors",
"36b40cb6984b3042": "MathOpFailed",
"011e6560f4c13bff": "Max",
"f8bdd61f3a46465c": "Max128SampleValue",
"74d65449aff462cb": "MaxAmountIsTooSmall",
"582dc8495ee72bea": "MaxAmountOfOrdersSucceeded",
"6c163b85f8bd6e22": "MaxAmountToPayExceeded",
"f27e6b2586751c74": "MaxAnnualRewardsRateExceeded",
"0d864c1641c53097": "MaxBasisPointsOffGraduationPriceTooHigh",
"3a83dcd9a7c3d3ed": "MaxBetSizeExceeded",
"6b9fdf2cc37237e9": "MaxBorrows",
"5c941a46619d398a": "MaxBuyingCapIsTooSmall",
"a72171bb277fa3cc": "MaxBuyingCapIsZero",
"1430766ca35bfd33": "MaxCapacityReached",
"8a87ae36e8f82af2": "MaxCapExceeded",
"56d060790e5a2fb4": "MaxCumulativeShortPositionSizeLimit",
"5a399046f9108fbf": "MaxDebt",
"1a530a637290ad87": "MaxDecimalsTooLarge",
"c8f918b52485cb4b": "MaxDeposit",
"1608366d0d820db3": "MaxDepositingCapIsInValid",
"3700b80f63c1527c": "MaxDepositingCapIsTooSmall",
"a9c232c6ed718e3b": "MaxDepostsReached",
"8d820c9532fc5e35": "MaxGraduationPriceDeviationBasisPointsTooHigh",
"a854f58d90ed57e7": "MaxHibernationChancesReached",
"569392ce9ef78a90": "MaxIFWithdrawReached",
"1e8373e67c4ae237": "MaximumAmountOfRevenueShares",
"7f12224df9c491a8": "MaximumBetsPerInstanceReached",
"17346d11c66a658a": "MaximumBetsPerInstanceTokenReached",
"83c7b52ca43c02d5": "MaximumBetsPerInstructionExceeded",
"0ca005d9b39963cb": "MaximumRedeemedAmount",
"524ae8873e5df916": "MaximumTokensPerInstanceReached",
"f8b835d32867cb37": "MaximumWithdrawValueZero",
"e98eb8c368eedd98": "MaxInitLeverage",
"4ddbff4c9baa4694": "MaxInvestableZero",
"845b8762ab478ceb": "MaxLeverage",
"dd2e6522e30f865c": "MaxLockedLiquidityExceeded",
"252cfe9a06112b21": "MaxLockIsNotSet",
"59733ee5c4358642": "MaxLockIsSet",
"a6abcef2e6176c61": "MaxLossExceeded",
"59e416f7666c70d2": "MaxMessageBodySizeUpdated",
"76ede20d6155b8b4": "MaxNodesExceeded",
"ef88002fd08a8bd5": "MaxNumberOfConfigsReached",
"c3f3d267cace811c": "MaxNumberOfOrders",
"6ca32d7c5a3c4cb0": "MaxNumberOfPositions",
"76a4e698f72a9cfc": "MaxNumberOfUsers",
"e98037a0e3b7088b": "MaxOpenInterest",
"e530449b959e558a": "MaxOpenOrder",
"56b32903ebb5fb5b": "MaxOracleTimestampsRangeExceeded",
"0881a1e8650512f3": "MaxPayout",
"1c2ade32afaf4e58": "MaxPayoutExceeded",
"3c4d0806635136b3": "MaxPositions",
"98017d4e02983ef4": "MaxPriceAgeExceeded",
"049c6cb66c8cce27": "MaxPriceAgeSlots",
"fe5f3a2a29a7c3a9": "MaxPriceSlippage",
"889240bc3eead90c": "MaxPriceTimestampExceeded",
"96d61eb63d99e05a": "MaxRegisteredCustodies",
"85f7e47ed54e1af2": "MaxRegisteredPool",
"efa63b6f016bb370": "MaxRegisteredResolvedStakingRoundReached",
"bd0f94b7c61b0ade": "MaxReserveValuesInput",
"75f3ba8eceb01e38": "MaxReserveValuesInputUnpacked",
"075a2d951231166d": "MaxRevenueWithdrawPerPeriodReached",
"366161b246555bd3": "MaxRewardNumberReached",
"751f5b8a19e330f2": "MaxSizeBelowCurrentSize",
"d5ff91eddaea1482": "MaxStakeWantedTooLow",
"c261da40c1791465": "MaxStopLossOrders",
"c3fb3decb18452e4": "MaxStrategyReached",
"68a6aaf6e3d53af3": "MaxSupplyExceeded",
"7075b267b7e2e96e": "MaxSwapAmountForPoolPriceCorrectionBasisPointsTooHigh",
"2267b33295535914": "MaxTakeProfitOrders",
"f07eecdaebdf4f02": "MaxTakerSellCountExceeded",
"f32df6feba586a74": "MaxTakerSellCountTooSmall",
"1d8f96395a87e6c2": "MaxTotalPayout",
"c4a0f95c261bfaf3": "MaxTotalPayoutExceeded",
"19f703d2d737c6c6": "MaxUtilization",
"1a8ad077e999047c": "MaxValidatorsReached",
"9d5ff29710621a76": "MaxVoterWeightRecord",
"e65f3c703d9da3dc": "MaxWithdrawTokenRequest",
"c4caf7233535b0ff": "MayanSwift",
"b44d1ea93f9d1795": "MedianOutOfRange",
"6e25cb752e5df6bf": "Medium",
"9ef4e8869d956cae": "MegaSlotInfo",
"3613a2151da611c6": "Member",
"c307994ee8e1d541": "MemberNotOwnedByTreasury",
"12f9337ef0f27c75": "Members",
"b50717767043e3bc": "MembersEntry",
"e8209f63fb7238c1": "MemberStatistics",
"bcb3ca2c7de07f8b": "MemberStatus",
"e8e00093bbc2871a": "Meme",
"f03abd9e557127c5": "Mercurial",
"6a64272699d88909": "MerkleData",
"4d778b4654f70c1a": "MerkleDistributor",
"0a98e925a2f9f595": "MerklePriceUpdate",
"7314d35edb5fa517": "MerkleProof",
"85181ed9f014de64": "MerkleProofMetadata",
"f88d822ee56be3c7": "MerkleProofMetadataCreated",
"1ef05e914a3b8ab9": "MerkleRoot",
"6702ded94932bb27": "MerkleRootConfig",
"28a1f44408d1f4fa": "MerkleRootConfigCreated",
"623333e2a21449d4": "MerkleTree",
"df24160637e02ccb": "MerkleTreeAndQueueNotAssociated",
"cabb18076e055776": "MerkleTreeMetadata",
"3314d04462ab3b19": "MerkleTreeSequenceNumber",
"ccd0450bd77d0620": "Meson",
"6e97176ec6067db5": "Message",
"c09ffe1a0d22c7a1": "MessageAddressTableLookup",
"a9e0ee8f49c0b485": "MessageBodyLimitExceeded",
"52eec7529fc97a89": "MessageExecutionState",
"b0a39bbf888e07b3": "MessageFeeTooHigh",
"7e4e175ef0093b7a": "MessageGasLimitTooHigh",
"468838aae4e17781": "MessageHash",
"6766da1ccc87470e": "MessageLibInfo",
"32eb4ae2ae6995f3": "MessageLibType",
"9f5352c3c447f1dd": "MessageReceived",
"83648538a6e1973c": "MessageSent",
"815ec1ba4dc3cee8": "MessageStatus",
"6e4b105b66dbfc88": "MessageTooLarge",
"6d5ecc9a1a3c0bd0": "MessageTooShort",
"4728b48e13cb23fc": "MessageTransmitter",
"8bdd255ffb97988d": "MessagingFee",
"f540cbd93f1ab988": "MessagingReceipt",
"484071ff61e1afff": "METADATA_SEED",
"47e5957451f679aa": "MetadataAccountMustBeEmpty",
"cbc636f3dd26f71c": "MetadataBasisPointsTooHigh",
"59af5a1979c2fa4e": "MetadataImmutable",
"613040d5f66df4c9": "MetadataNameTooLong",
"53da8593d38fa4a6": "MetadataNFTOrganization",
"be682f569bf2ece9": "MetadataNFTPaidBuddy",
"4c8780af3b369dc3": "MetadataSymbolTooLong",
"82308e15d66c1123": "MetadataUriTooLong",
"59385b904d384bea": "Meteora",
"513ed7cb7e8d9764": "MeteoraCpAmm",
"119b8dd7cf04859c": "MeteoraDammMigrationMetadata",
"7f8a519d0b0f5080": "MeteoraDammV1Swap",
"5f03ee9a64f683a6": "MeteoraDammV1SwapOptions",
"01e65993ee04ab88": "MeteoraDammV2",
"c132f8be000b16be": "MeteoraDAMMV2",
"68dddbcb0a8efaa3": "MeteoraDammV2Metadata",
"1e7578b4d4f9f0cd": "MeteoraDbc",
"3bb13860412e0ad8": "MeteoraDlmm",
"141ec1ea0e2e1c31": "MeteoraDlmmAtoB",
"09b948962ac861f6": "MeteoraDlmmBtoA",
"b3ec5ba33e42151f": "MeteoraDlmmSwap",
"1daac0731072b165": "MeteoraDlmmSwap2",
"48b5bdd090486034": "MeteoraDlmmSwapOptions",
"67b630952a8a1a0b": "MeteoraDlmmSwapV2",
"ce2ac69b7d2c1e17": "MeteoraDynamicBondingCurveSwap",
"8b9eb8101f6de3c0": "MeteoraDynamicBondingCurveSwapWithRemainingAccounts",
"daec8e5f8b4babe9": "MeteoraDynamicpool",
"0cc516f7e92306df": "MeteoraDynamicPool",
"e00f7c1630a31ba6": "MeteoraLst",
"37a981fb9c00abf1": "MeteoraVaultDeposit",
"5a0691a4a18fc355": "MeteoraVaultWithdraw",
"6ba61ce8c490cec3": "Metrics",
"af2a31424bc16ef5": "Mid",
"b34ddf76fdbb4ec2": "Migrate",
"e56a858dfb039fb3": "Migrated",
"8438feab30072eef": "MigrateFeeAccount",
"df2114f423901341": "MigrateFlpLog",
"b252ba0d12d72945": "MigrateNftInfo",
"5768d9714fec4241": "MigrateStakeLog",
"1ece86982bffd19c": "MigrateTypeNotMatch",
"f7b266150054cc7c": "MigrationFee",
"6fea66c6b59805bc": "MigrationFeeHasBeenWithdraw",
"414b5fcf9443ea99": "MigrationKind",
"f5c49fcd8df2b704": "MigrationTarget",
"e28961d865584bf3": "Min",
"773545c9aaa93022": "MIN_BASE_FEE",
"981a2c1d11218b8f": "MIN_BIN_ID",
"e16becfc6521d366": "MIN_REWARD_DURATION",
"ad5926a37a65ee6b": "MinAmountOutNotSatisfied",
"d09c9899bc136ec8": "MinClaimDurationNotReached",
"1de8afa555f298f6": "MinCollateral",
"2c9be1d6d8df9e31": "MinDepositAmount",
"1220527e7cecaee8": "MinDepositAmountTooLow",
"0aee2758b3fc05b8": "MineAsteroid",
"be9d3067e704f121": "MineAsteroidToRespawnInput",
"4037d413d79c1642": "MineItem",
"df710f367b7a8c64": "Miner",
"df2110eef5e73140": "MinerCreatedData",
"5fb085504a5e08fb": "MinerUpdatedData",
"1836441e9bfdcd82": "Mines",
"57b6b1635e5682b3": "MinFeeControllerSet",
"d75f048ab39a0b0a": "MinFeeSet",
"7e8cebc5b30629e1": "MINIMUM_LIQUIDITY",
"5761bb14310c005a": "MinimumOfferPrice",
"52cee07f6ad94747": "MinimumPrice",
"6d6d356da255238b": "MinimumSlippageExceeded",
"c2652af7258dac5f": "MinimumStakedAmountNotMet",
"2e1d7a88c43f3d7b": "Mining",
"ba7b4e7e73881ea9": "MinInvestAmount",
"8e554fb0be58a7b8": "MinInvestDelaySlots",
"84b7d7d3e2582309": "MinLeverage",
"7857686cca56ff73": "MinPerformanceFeeBps",
"29b600aae8702523": "MinRedemptionSharesTooLow",
"420cef6967d50344": "MinReferencePriceSlippageToleranceBps",
"cd08ef7edd6b90e7": "MinReserve",
"3e5c9e8adb097c18": "MinStakeIsTooLow",
"388011643296bec8": "MinSwapUnevenSlippageToleranceBps",
"50bcf5145f8a399c": "Mint",
"089987692c58e881": "MINT_PROOF_SIZE",
"08b39ecc4f56c7bc": "MINT_SEED",
"3ca8f58bea9fd344": "MintAccountNotProvided",
"889249565fd01424": "MintAccountNotSpecified",
"6dd457ea5e0f09ba": "MintAndWithdraw",
"4e91d56269bdf663": "MintArgsV0",
"7c86dfe75e95108e": "MintAuthorityIsNone",
"100c334499b22ba0": "MintAuthorityListFull",
"746549803ee4afa2": "MintAuthorityNotFound",
"1d3b0f452e16e3ad": "MintCounter",
"81602a2bc4da71ed": "MintCrewMemberInput",
"bfb254d2b8faa732": "MintDataCreditsArgsV0",
"15f6863527d89c72": "MintDecimalsUnsupported",
"1c456ba6298bcdf7": "Minter",
"8188790633d8a1fc": "MinterAllowanceExceeded",
"b9edb504fb4165e7": "MintFailed",
"1d434cd740867a54": "MintHasInitialSupply",
"26fc2201ce7953bb": "MintingMethod",
"a2132ba425140a5c": "MintIsLargerThanOrEqualToNativeMint",
"7cfc120c17cf3c9d": "MintIsNotTokenIn",
"6dd43c909fb7425d": "MintIsPaused",
"09c9a9853f976dfd": "MintLimit",
"0467b7654ec287fe": "MintNotFinished",
"06c995d6ffc076cd": "MintNotLastTransaction",
"318c7e95335628bc": "MintNotLive",
"e3836af0be30dbe4": "MintProof",
"32ce2beaff93c629": "MintProofType",
"16c596b2f9e1b74b": "MintProofV2",
"785a7c744ae520c5": "Mints",
"51118f7817391675": "MintState",
"ff6765304f9bb965": "MintStateLocked",
"9cec3814278d2ab7": "MintsToScopeChains",
"75f8cd5778cd19bb": "MintTooLarge",
"56a3276c6163054e": "MintToScopeChain",
"cd470f9e61b6a1ba": "MintWindowedCircuitBreakerV0",
"9aa640efaa634a9e": "MintWrapper",
"26c7ff68910ed640": "Minute",
"14b664856ab38317": "MinWithdrawAmount",
"3cdb31cf5ec91a3c": "MinWithdrawAmountTooBig",
"94158e9a3b5fe090": "MinWithdrawIsTooHigh",
"262ff0dba4fadc0c": "MiscStats",
"9171244b48d4dc3e": "MiscStatsUnpacked",
"4f96f09d27c043fe": "MiscVariables",
"fcc9e56d97ded4a8": "MiscVariablesInput",
"a1c0d232eb65a4b1": "MisMatchedCurve",
"a84690fbd1a1f419": "MissedInstruction",
"b691c829f0972387": "MissingAccount",
"080c835da42cc0e1": "MissingAccounts",
"794820ea3e20bb0c": "MissingAdminSignature",
"8d29a79c229946c3": "MissingAfterInstruction",
"a7f78584aa2c1a66": "MissingAllowedListProof",
"59707aa809d97692": "MissingApproveAccount",
"92b73bc000bf9ec4": "MissingBankAccount",
"a1279da6cb83a079": "MissingClosePositionPrice",
"5a8bfb64e9bbee12": "MissingCollection",
"0decef24266ec30c": "MissingCollectionAccounts",
"9c8c97d78ca18b39": "MissingCollectionAuthorityRecord",
"21f370e0edaf628f": "MissingCollectionMetadataAccount",
"9f67c93888843745": "MissingCollectionMintAccount",
"c0bd2b3baea77fe6": "MissingConfigLinesSettings",
"f6e062c7044af95b": "MissingCosigner",
"7ff4c30328c2e3f4": "MissingDroppedStakeEscrow",
"bcd6ab2930493f66": "MissingEd25519Instruction",
"206d293351f3b613": "MissingExpectedMerkleRoot",
"c5fabfbc305c57ca": "MissingExpectedPriceUpdates",
"ecc8e2706540882e": "MissingExpireTime",
"b43ddcb93a713ece": "MissingFeeReceiver",
"5e2b6b0d35c40b29": "MissingFees",
"20e7002c3be1c5d1": "MissingFinalOutputToken",
"365f9b1920949ecd": "MissingFreezeInstruction",
"84e32549697a84fb": "MissingFreezePeriod",
"25c94085f57fdb17": "MissingFvc",
"45dbd1e2388cc807": "MissingGlobalReferrerAccount",
"f0cc70760d4f540a": "MissingInitialCollateralToken",
"11c6e1a2b27b4d9a": "MissingInstructionsSysvar",
"7d31cea6c7da78c7": "MissingMakerBroker",
"35dd3385091d2bbe": "MissingMakerDstAta",
"db734767e6f16a27": "MissingMakerSrcAta",
"1be2d0db45e5e57a": "MissingMetadataDelegateRecord",
"68bcce1dbbbb6570": "MissingMethodForGame",
"024c436311816c90": "MissingMintProof",
"14366a07f0f8ff6f": "MissingName",
"5cfe5e8b6abb3603": "MissingNft",
"f9d3bae52f47459d": "MissingOracle",
"033a041670f9f4a8": "MissingOraclePrice",
"1c89f66f0d8f31e1": "MissingOrInvalidDelegate",
"c1323153ed5469b0": "MissingOrInvalidReferrerAccount",
"ce98684632a94007": "MissingParameter",
"d07206af0771c8b4": "MissingPermission",
"f8aaac5f2ce42f2d": "MissingPlatformFeeAccount",
"f4ebe8db0bb07d1b": "MissingPoolConfigInRemainingAccount",
"f5e1d05d8647ddc0": "MissingPoolTokens",
"b3b679f2c4da196d": "MissingPostSwapIx",
"80f3921acad7607a": "MissingPreSwapIx",
"f43ec62cd8be7e4e": "MissingPriceSlippage",
"582045c0dd987317": "MissingPythAccount",
"1a0442985a80adc4": "MissingPythOrBankAccount",
"dbdf8059d3665c28": "MissingRemainingAccount",
"f44991dc802620e7": "MissingRemainingAccountForTransferHook",
"068b2ab5ff2fb4f1": "MissingRentedCrew",
"783689b5167fa6e9": "MissingRepayInstructions",
"d596b3e1b82ea3b8": "MissingReserveForBatchRefresh",
"6f0ec851dcc12ac8": "MissingScopePrices",
"530fcb477acb1691": "MissingSecpIx",
"a1bd6bbcd8069f5f": "MissingSignatureData",
"adef1a4c7270db04": "MissingSmallestStakeEscrow",
"023cb366332bb4b3": "MissingSplAtaProgram",
"5d1e33461676334c": "MissingSwapInstruction",
"ed0567e7445aa424": "MissingSwapInstructions",
"6cdf5f0016989b24": "MissingSystemProgram",
"54587a75428b2524": "MissingSysvarAccount",
"23a061826b6a1584": "MissingTakerDstAta",
"12d2211bb702b6a7": "MissingTargetAccount",
"b46d231a483f6324": "MissingTemporaryWrappedSolTokenAccount",
"cfe71f4cd0b8a099": "MissingTickArrayBitmapExtensionAccount",
"0f1eb996c3b392b3": "MissingTokenAccount",
"322edb9d3291d6e0": "MissingTokenAccountForMint",
"48161b61192ba947": "MissingTokenAmountAsTokenLaunchProof",
"9160a2ddf107c7ce": "MissingTokenRecord",
"f5afa756aa093213": "MissingTriggerPrice",
"13e93f74dcf9e1c5": "MissingUserLimit",
"38c0670b73399ce5": "MissingUtilityScores",
"9a38f171c7c77200": "MissingVerification",
"f9886e4cb0b56ffb": "MissingVod",
"4842843ab76989a2": "MNDE",
"bccd4a42e4b59636": "MobileConfig",
"f0bfde3a4df7e2d8": "MobileConfigV1",
"825bc579fbec7e9e": "MobileConfigV2",
"a53ca83add66fd0f": "MobileDeploymentInfoV0",
"11a4171d5360b188": "MobileDeviceTypeV0",
"79c874d129f1e4b8": "MobileHotspotInfoV0",
"1944779bfbb9dc87": "Mode",
"f9b490e17e9fcad1": "ModeConfig",
"98ddf77ab97ddf97": "Model",
"993c0b3afa14c406": "ModeMintNotReadyToClose",
"9695c1380a7eb369": "ModeNameTooLong",
"6dd1e679f6d7f5fb": "ModeState",
"4b1179926d0bebb6": "ModeStateNotReadyToClose",
"b5b3af94d9762474": "ModeTokenNotReadyToClose",
"4e2fec3bd7c9aea6": "ModifyOrderId",
"e7423a29b4af5c02": "ModifyOrderPolicy",
"da91e59b9dcd0cfb": "MoneyLineOver",
"716791c78a235cb5": "MoneyLineUnder",
"0a64b859816476c4": "Month",
"29c68fac7160e421": "Monthly",
"3ecd94d61bf1fe32": "MoonshotWrappedBuy",
"ff2983d6700097b2": "MoonshotWrappedSell",
"ccad346a98874f6d": "MoreThan20Assets",
"b8c191ffb0d36057": "MoreThanExpected",
"d678172a60abf4e2": "Mortgage",
"4a25886beb20bb07": "MostRecentOf",
"d366c86f0d5651a5": "MostRecentOfData",
"5e9e7606ec52e933": "MostRecentOfInvalidMaxAge",
"b8db4cb751e7a7bc": "MostRecentOfInvalidMaxDivergence",
"af73ac954785584c": "MostRecentOfInvalidSourceIndices",
"0931fc3c14f880dd": "MovementStats",
"4fb6a683476d01e7": "MovementStatsUnpacked",
"c88800dfd4d0db0b": "MoveProtocolFeesLog",
"8e2ebd03bcf5dad5": "MoveSubwarp",
"dabf9794b1dcd0eb": "MoveWarp",
"00c3df89dcc67882": "MovingStakeIsCapped",
"9cd6ab60deff69b3": "MrEnclaveAtCapacity",
"7c1bd642e6f224ff": "Msglibs",
"21b3c7036dedddf0": "MsgType",
"4d870ce614b2b5bb": "MSOL",
"845d832308fb898f": "MSOL_EMA",
"134f69afb4ef82db": "MSOL_TWAP",
"300e06c9e203ce9c": "MsolStake",
"fb4ccdcf3a3b4d60": "MUD",
"29b6e1694478cf4f": "MulDivInvalidInput",
"0f0a46382480286b": "Multi",
"21336d201c9f3dae": "MultiplayerMultiToken",
"b7eeaf9575f6439a": "MultiplayerOneToken",
"4fd9a1e3f7f2b4c2": "Multiple",
"fd2177291be2aad2": "MultipleFlashBorrows",
"4b83f8bd24a3e718": "MultiplePermissions",
"e07479ba44a14fec": "Multisig",
"e82827c6b51d6410": "MultisigAccountNotAuthorized",
"db68f30d475156c0": "MultisigCompiledInstruction",
"2c3eace1f603b221": "MultisigConfig",
"9e4185b4b945e617": "MultisigCreateArgsV2",
"cdc43d72d9f495d5": "MultisigMessageAddressTableLookup",
"e6559757dbe8257a": "MultiSubmission",
"16bc22bd886f57f2": "MustBeOnlyInstruction",
"9e9c8df499757114": "MustCalculateVehntLinearly",
"fbc0f5bba55ed339": "MustCallLockPermissionless",
"06ceeb36927e7479": "MustCallLockWithWhitelistEntry",
"f4fc6c73a3d11dc5": "MustCallProxyLockWithWhitelist",
"8bf4f910e4478735": "MustDisbandFleet",
"7cb2ddaa733fef38": "MustHaveQuoteTokenOrInvalidStakeMint",
"406107141ee772b2": "MustKeepTokensLocked",
"f82fef0b34f03439": "MustModify",
"0581cf7ce0e549e1": "MustPostOnly",
"f162ae3ceee6bfd2": "MustProvideWhitelist",
"dbc83c40b116058b": "MustRemoveAllEpochs",
"306bc340c6a7869c": "MustSettle",
"a3d94e46ec4e3653": "MustWithdrawnIneligibleReward",
"8a36df3ddbe448b2": "MutuallyExclusiveTokenAccount",
"ea09530289da5783": "MutualReferral",
"8a608e306e1ab7ea": "Name",
"ce296df95bd1be82": "NameCheck",
"ec744b670496f4c3": "NamePrefixTooLong",
"49838f414a7b8469": "NameReservedByPaidBuddy",
"29374d133c5edf6b": "Namespace",
"c6a4c347970d461c": "NameTooLong",
"6684c142497ad3fc": "Native",
"1bdea580cdcfe26d": "NativeAmountExceedsCap",
"055f15d10a065b60": "NativeDropRequest",
"e0c9a3384d0538b1": "NativeSol",
"f657ec300ef65557": "NeedsToBeLevel3Habitat",
"b8dffdb877887be6": "NeedToClaimAllRewardsFirst",
"2e26ed5f1c880694": "NeedToHarvestAllRewardsFirst",
"31f98bccff42a767": "NeedToProcessFirstOrderBeforeOthers",
"d653f4b37d81c51b": "NeedToSettlePreviousRound",
"8146a264f2d26218": "NegativeBalance",
"8ffd6e8ce025caa2": "NegativeInterestRate",
"dffbe4c771a74157": "NegativePrice",
"2cfee83c36e0f16a": "NegativePriceIsNotSupported",
"74ca4c774b87cf5d": "NetValueRemainingTooSmall",
"cf2220b8dc7ba89a": "New",
"e64cf1f58acc1a89": "NewAddressParamsPacked",
"9db05ec1c6b1df36": "NewCompound",
"b635d2cc6bc864d0": "NewCurve",
"b4637ecd58389bd5": "NewCurveType",
"daddb3decdad3f84": "NewDistribute",
"56b367f7f6b8ab9c": "NewFeedParam",
"99946c3e4adf14c0": "NewLPSizeTooSmall",
"7d6876ac06997513": "NewOracle",
"151f5c0c28f65d9d": "NewPositionPricesAndFee",
"1344aec0e519bb87": "NewPriceRange",
"7b308ed2b9fc1b75": "NewRange",
"fd775633cc376e2a": "NewRestakingVaultUpdate",
"a69dc3100fe56e06": "NewStakeAccountShouldBeUndelegated",
"0feb060ea38d0877": "NewTickRange",
"2d299dbe644465ce": "NewTransmission",
"fccafeae142edf29": "NewUserRecord",
"b9917e9a4c5ada1d": "NewVaultNotEmpty",
"ab181cf8167cd31c": "NewWrappedTokenUpdate",
"33858471c6e189ee": "NextRewardNotReadyYet",
"835d90d0745b0a42": "NextStakingRound",
"7bfc68b1ee2a4000": "NfNodeEntry",
"5f16d7e720653f4d": "NfNodeType",
"580a92b0650b28d9": "Nft",
"61e6061583d06f73": "NFT",
"6f283ffa6a80e1ed": "NFT_AUTHORITY_SIZE",
"c27fdb10db12fa0c": "NftAuthority",
"3f6dd5219bf455bd": "NftBoxShouldBeActive",
"31a6296f82424a59": "NftBoxState",
"e27579c7218ccfa0": "NftBoxType",
"df7e74b0fdd7519b": "NftBurn",
"e88aae8b2e4cb361": "NFTCreated",
"ceff84fe434e3e60": "NftDepositReceipt",
"44bde9fee9014aed": "NftForToken",
"4f5c01a79b39ed8b": "NftGate",
"5a213e93c94a3e26": "NftIsNotMasterEdition",
"44e5f75924a3985b": "NftLiquidationTimeNotPassed",
"7a98fcd5ec5e275e": "NFTMetadataNotBelongMint",
"f8175e4865893e10": "NftNotVerified",
"660f3a70eb7e1aab": "NftPairBox",
"b51a3bdd208753bc": "NftPairBoxNotClosed",
"60b3e7b9ab08084b": "NftPairBoxNotParsingFromRemaining",
"d4a4bd75baa94c9f": "NftPayment",
"876bfd2df88de97e": "NftSwapPair",
"8385a28deb1dba4b": "NFTTokenNotBelongMint",
"430376bf9657ac51": "NftValidationAdapter",
"20e1084bcf2f14a0": "NftValidationAdapterV2",
"8bedbfde0a3c7813": "NftValidationAdapterV2CanWhitelistOnlyMerkleTree",
"702ae7be5499e422": "NftValidationDurationType",
"0aad3f6062930bbd": "NftValidationWhitelistType",
"7baf2f9298ee00bb": "NftValidationWhitelistTypeV2",
"b9a6eb06f29b0302": "NFTWallet",
"2caca5f59c868ca1": "NinaReleaseV1",
"595bd426ce745278": "Nine",
"20e056076280bc77": "NoActions",
"e6f97cd89a05f16e": "NoAdapterResult",
"c40a5e917011fc22": "NoAlchemistAssigned",
"56eb195bac59e8e4": "NoAmmPerpPnlDeficit",
"51afd766fa24b69e": "NoArbOpportunity",
"fb22009808e05265": "NoAssetFound",
"0f08e5fb9feff426": "NoAssetsToCollect",
"816efb2f27fea02f": "NoAuthorityTransferInProgress",
"1b157c480061f66c": "NoBestAsk",
"9e67855bca0f2310": "NoBestBid",
"de363ea621052a0a": "NoBetsOnSlip",
"4a5909a03f307e6b": "NoBorrowLiquidity",
"1e6e0fc6f182075c": "NoBuyOrdersOnThisPair",
"c5fddae287830403": "NoChainForToken",
"22d50f7f2036febb": "NoChainlinkReportData",
"92a8a4c377c62150": "NoChangingCollectionDuringMint",
"4d273727daaa1c4f": "NoClaimableRewards",
"0f74ddd095f29cc6": "NoCloseMarketAdmin",
"a662412619502cd6": "NoCollateral",
"ef853ccc045aa1ac": "NoConditions",
"c2735ab9b03d7101": "NoCreatorsPresent",
"a993c78591b34726": "NoCrewItems",
"d0350103317ab431": "Node",
"8d5dc51ed9738f62": "NodeKeyInvalidCollection",
"7e98841044f9f082": "NoDelegatedAuthorityIsSet",
"c75c57e39a440a1b": "NoDelegateEndingPosition",
"aff76a75ca8e827f": "NodeNftInvalidAmount",
"1fea52faa5a619a6": "NodeNftWrongMetadata",
"2340782c5722fae8": "NodeNftWrongOwner",
"a42877d61a5c4bbd": "NodeNotEnoughStake",
"31b6a48f7148467c": "NoDepositInstruction",
"de60aab46a4c3fa1": "NodeTag",
"3eeeaa7ffc990c5c": "NoDeveloperRewardsAvailable",
"bd6adf6c07a324a2": "NoEmptySubHabitatSlots",
"8d31f33145853734": "NoExecutors",
"b6a8eadece5077cd": "NoExtraAccountsForTransferHook",
"cc469bdba619d79f": "NoFarmForReserve",
"6b85d614d63a8db1": "NoFill",
"0abf8aad1e44119f": "NoFlashRepayFound",
"b43f62b465c22af9": "NoGenesis",
"123aecf7039f239b": "NoHarvesterAssigned",
"00ae18bdb0012a20": "NoIFWithdrawAvailable",
"1e054bd1341615ab": "NoIFWithdrawRequestInProgress",
"3708ab350447d663": "NoInATA",
"1793f60256057432": "NoInputs",
"27e839898c3ecaef": "NoInputsProvided",
"8f5417934c387911": "NoInputTokenAccountsProvided",
"f66c5571dfb658fe": "NoLaunchStages",
"84eb35823992a448": "NoLeavesForMerkleTree",
"460ea5aa3d021ba9": "NoLiabilitiesInLiabilityBank",
"2cb822a1d8f3ff83": "NoLiabilityFound",
"72b2c6a8c0204ef2": "NoLimit",
"de85d4b14040a524": "NoLiquidityFeesToWithdraw",
"56ab597da3b15266": "NoLutKeysAdded",
"a59bd4436c25ea47": "NoMatchingLaunchStage",
"c38360378cfd5dc3": "NominatedAdmin",
"7729d19b776af91a": "NoMoreCrystals",
"a381211c16c85a10": "NoMoreDurabilityLeftForRepair",
"9e2ac1ef46efdb47": "NoMoreRedeemablesAvailable",
"bd8b5f085bdf1772": "NonBondStakeAuthorities",
"8fc5935f6aa5322b": "Nonce",
"9acec72fe57d77fa": "NonceInvalid",
"844549d4a3a66cb0": "NonceLimit",
"a60d9f03e4b964cf": "NonceUsed",
"41f68ec31dc94ef7": "NonCollateral",
"78a53160382711be": "NonContinuousBinArrays",
"e7c4a94d39786178": "NonDefaultStore",
"a0fb26da98d1a672": "NonDepletedPool",
"b399245df5f89144": "None",
"f0e309e598a4e137": "NONE",
"0f41d30117a6218f": "NonEmptyMarket",
"a3e6f9f8f652abf0": "NonEmptyOpenOrdersPosition",
"885479c73bbeef6f": "NonEmptyPosition",
"192a2e8c929e31f8": "NonEmptyReserveData",
"fcbe600caee15e32": "NonexistentGovernanceAuthorityTransferRequest",
"700af443afbff442": "NonFungible",
"97c72e99c4c56229": "NonFungibleEdition",
"6b9e0337e5b23676": "NonPositive",
"e5e8226b5e6432ce": "NonPresetBinStep",
"2bba9b47b7cf1bb2": "NonSigner",
"1ccfc3ef595b6ca6": "NonUniqueSignatures",
"b299fcf969e0fd28": "NonUpdatableCurve",
"a4bc4bd1d45cff5e": "NonZeroDelegation",
"4941fe7c1ffc5343": "NonZeroMinimumOutAmountNotSupported",
"c83882d337b46292": "NonZeroPubkeyOption",
"aa07d96ad8a1ae85": "NonZeroRstMintSupply",
"81781949ec862a89": "NonZeroRwaTokenInVault",
"83a33e34142daa3d": "NonZeroSUsdMintSupply",
"35606269d1a26bc5": "NonZeroTransferFee",
"d6d2fa9e423a81fc": "NonZeroUsdcInVault",
"0ea50d00c1d78203": "Noop",
"988670b80df9dbd2": "NOOP_PUBKEY",
"0d861151adc81b8c": "NoOracle",
"6e4b58870376e1e5": "NoOresAvailable",
"debe04c9f252a560": "NoOutATA",
"2d2c195529af5d7a": "NoOwner",
"b2ee78df2ff79ec3": "NoOwnerOrDelegate",
"451a417541132f75": "NoPassengersAllowed",
"a49c16298b28d3b6": "NoPayerPresent",
"c3ae950020ea217a": "NoPendingChange",
"61c3396bec3a3f48": "NoPermission",
"d49dc73ed39cc67d": "NoPosition",
"ebdb82db24f0781c": "NoPositionsLiquidatable",
"1be3c951b6d30475": "NoPriceFound",
"313b75275186d5c6": "NoProposers",
"858c56d6ab9db5e8": "NoQuorum",
"287a5066b252200e": "NoRebalanceNecessary",
"f93228d7d13ab31f": "NoRefilterAndReweightForSellState",
"f39700ef5d8c163d": "NoRemainingAccount",
"9726f95e540b83ae": "NoRentalAgreement",
"5949ec0ff9647121": "NoRepaymentInstructionFound",
"219a14ddb7f742e3": "NoReserves",
"16b43cd721a03a55": "NoRevenueToSettleToIF",
"c485e12f486b6374": "NoRewardInList",
"1d38e335e3d26651": "NoRewardsToCollect",
"104f759ccc8443f7": "NoRewardToClaim",
"0ee333684e37cf8a": "NoRewardToHarvest",
"fe90362e0334c958": "NoRewardToWithdraw",
"84c92e726f264c7f": "Normal",
"bc89bf2e3cd41551": "NORMALIZED_TOKEN_POOL_ACCOUNT_CURRENT_VERSION",
"2737da6db7de23a8": "NORMALIZED_TOKEN_WITHDRAWAL_ACCOUNT_CURRENT_VERSION",
"0b4d79ebc9317886": "NORMALIZED_VALUE_DECIMALS",
"b8954144b9d87c89": "NormalizedClaimableToken",
"8eb6f7934c631475": "NormalizedSupportedToken",
"eb8a64d9a08d6e37": "NormalizedToken",
"0771e9b19942af38": "NormalizedTokenPoolAccount",
"1e7ad2c470e8b27c": "NormalizedTokenPoolNotEnoughSupportedTokenException",
"5d9cf3f4d1bee7f9": "NormalizedTokenWithdrawalAccount",
"3b6a9008780daa2d": "NormalizeST",
"c7e1dc0166e163ba": "NormalizeSTCommand",
"9aa355c823a3cead": "NormalizeSTCommandItem",
"1b05d4aef3e031ad": "NormalizeSTCommandResult",
"5a695f43f4c7d1a2": "NormalizeSTCommandState",
"4c2f9e64cc81f245": "NormalSale",
"375b94a23c521d3b": "NorthAmerica",
"6d9e76ab06f6d380": "NoSageProfile",
"ad1fea5b9bd6aee4": "NoSigners",
"58fd901fd40466b6": "NoSlotsPassed",
"517dfa200d800acf": "NoSpotPositionAvailable",
"b0a1d9e19b459c46": "NoStakeAccountMetadata",
"60b696d98ff5c4cc": "NoStakeOrNotActivatingOrActivated",
"81f12da243f93825": "NoStakeOrNotFullyActivated",
"4756e72e18dbb16a": "NoStargateConnectionsAvailable",
"86fa220e594ea929": "NoSuchStep",
"81e7e944da7afb49": "NoSwap",
"29ceed49995391e0": "NoSwapExecuted",
"f395f77e1288be83": "Not",
"713b1d4a5c58d5a8": "NotActive",
"89253d3de89e4bff": "NotActivelyManaged",
"eb035336685c241c": "NotAdmin",
"31856511154b865a": "NotAllBetsGraded",
"c32031b00e788385": "NotAllLeavesProcessed",
"e3ae7133c9df5993": "NotAllSettled",
"9b6fc4e274a0752b": "NotAMember",
"1aa2182c20cb1bb8": "NotAnAdmin",
"5a880dab1615c8ab": "NotAnATA",
"36e6d4074d701e5b": "NotAnOperator",
"a83fcb682fcf736c": "NotApproved",
"1bb9a371565d0b73": "NotApproveUpdateRewardEmissiones",
"c72c234311b349ba": "NotaryPublicKeyInvalid",
"c4c3e5e86e234ced": "NotarySignatureNotProvided",
"8adffddc5191efea": "NoUnsettledPnl",
"21c1fc5a0c78ebae": "NoUpgradeAuthority",
"c38789843a234276": "NoUserInATA",
"d7ddc399daa9edd9": "NoUserOutATA",
"574b9b697a3484c7": "NoUtilityScore",
"e5b859cd0d12bf9a": "NoValidSignerPresent",
"5946a13169822eb3": "NoVestingAmount",
"ee5a328264f71cf9": "NoVestingSchedule",
"c17081bc99210c29": "NoVoters",
"4134ed8471f97074": "Now",
"44adb4606cb61b52": "NttManagerPeer",
"2398d92207b43542": "NullifierQueue",
"0860f072a6e21ca5": "NullifierQueueConfig",
"fdffe5e70cca4026": "NUM_REWARDS",
"e063dafb22a648ef": "Number",
"e63e7c2b6665583f": "NumeraireConfig",
"c0ddce257fbacd87": "NumResolved",
"5d38669787dd2efa": "OAppConfig",
"09c84ebcd1656ef5": "OAppLzReceiveTypesAccounts",
"e23d61ddadfdb7ec": "OAppReceived",
"0698c71ed9324595": "OAppRegistry",
"1dfa3a2354ebacc1": "OAppSent",
"a8ce8d6a584caca7": "Obligation",
"5a68ecb50d56faf2": "ObligationBorrowsEmpty",
"e1490786db8ef9dc": "ObligationBorrowsZero",
"de33f9930557bdad": "ObligationCollateral",
"8ffba68e7783df96": "ObligationCollateralEmpty",
"3256139937f757d3": "ObligationCollateralExceedsElevationGroupLimit",
"dae6d5373a2bceb4": "ObligationCollateralLtvZero",
"b06b1229406d9071": "ObligationCurrentlyMarkedForDeleveraging",
"008c5dec027c47eb": "ObligationDepositsEmpty",
"95686fa8b487ecb9": "ObligationDepositsZero",
"3c3199b2de12af4b": "ObligationElevationGroupMultipleDebtReserve",
"59ed126e7d5cada1": "ObligationEmpty",
"335f33e97ae58732": "ObligationHealthy",
"837ca264a892a08f": "ObligationInDeprecatedReserve",
"39cd28b083b79933": "ObligationInObsoleteReserve",
"899465607f14250b": "ObligationLiquidity",
"4273b1bebcfe4577": "ObligationLiquidityEmpty",
"193dc5ebccd0e703": "ObligationOrder",
"95d78d56d7b50a3a": "ObligationOwnersMustMatch",
"4df3007af75eb433": "ObligationReserveLimit",
"bc829e5fc33a8486": "ObligationsMustMatch",
"9047da4a81dc7dce": "ObligationStale",
"f770e1f546f18102": "Obric",
"e4f73f0f83a57288": "ObricV2",
"cce411611afb4b3d": "ObricV2Swap",
"1e2aa4615d5ed7c8": "ObricV2SwapOptions",
"6dbebe5f1cacf34a": "Observation",
"7aaec5358109a584": "ObservationState",
"ea49fd0ff182c55c": "Obsolete",
"3698d9ae9b068715": "Ocr3Config",
"32f52cdd81f509e2": "Ocr3ConfigInfo",
"1cbfab3227cc80c9": "Ocr3InvalidConfigFIsTooHigh",
"c2c76358e7de60bd": "Ocr3InvalidConfigFMustBePositive",
"b8d6abd098caa1c0": "Ocr3InvalidConfigNoTransmitters",
"0e1a6961f1f8e06e": "Ocr3InvalidConfigRepeatedOracle",
"f9e5676e0919f8d5": "Ocr3InvalidConfigTooManySigners",
"015b2e638808920a": "Ocr3InvalidConfigTooManyTransmitters",
"20a2f041f8bdceb1": "Ocr3InvalidPluginType",
"749025adcb150976": "Ocr3InvalidSignature",
"035fc65310aa7456": "Ocr3NonUniqueSignatures",
"7d0ec346647df643": "Ocr3OracleCannotBeZeroAddress",
"bb917404b3a8d14b": "Ocr3SignaturesOutOfRegistration",
"e4904eeb90e7851d": "Ocr3StaticConfigCannotBeChanged",
"ce6823e9d53f6927": "Ocr3WrongMessageLength",
"be1378419efbe280": "Ocr3WrongNumberOfSignatures",
"b997ad7eff898a7f": "OcrPluginType",
"62a9c998a13edf0f": "OddEven",
"f531962c08bcbffa": "OddsOffsetChanged",
"2b52043258b012bc": "Off",
"9db6e338f4ef44f0": "OffchainConfig",
"763473966345a44c": "OffchainRewardConfig",
"b3ce636e8308c0ef": "OfferType",
"75f7f6a72316e65a": "OfframpInvalidDataLength",
"d712a912e6e7fcf8": "OffsetFromStartTs",
"c96f93b65858619b": "OFTFeeDetail",
"b84835699afef0a4": "OFTLimits",
"fbb741d93746048c": "OFTReceipt",
"24a91690ccd28b11": "OFTReceived",
"8827f24386ef3c90": "OFTSent",
"c3d76886b9c3f072": "OFTStore",
"66df51c0f8d10534": "OFTType",
"f7cb2d4a545884eb": "OldSellerNotInitialized",
"495eacf5f7df662f": "On",
"7a6bf2c7ff589380": "OnboardDataOnlyIotHotspotArgsV0",
"ed1708ad95d0a4b4": "OnboardDataOnlyMobileHotspotArgsV0",
"e6bf351559005e5d": "OnboardIotHotspotArgsV0",
"daa155d8bff66376": "OnboardMobileHotspotArgsV0",
"32a8ce712cf84ed2": "OnDemand",
"2a8ef4cde33e6cdd": "OneIntro",
"da75dc8854222d7b": "OneTime",
"1f2634e3c7432db5": "OngoingLiquidation",
"d37a0db429175276": "ONI",
"e254813d41f00bb8": "OnlyAdmin",
"d3f5b089dcd0fb4b": "OnlyOwner",
"a05360e07ddd1cf2": "OnlyReceiveLib",
"ac4d8df487c56d30": "OnlySendLib",
"28ed536c1caf0381": "OnMarketTokenized",
"7a4f29a5d70d8e59": "OnMarketVirtual",
"7e4440f636e9daf1": "OnRamp",
"9d9e3ad055280a8e": "OnRampAddress",
"bb044f8edf983aeb": "OnRampCustody",
"e8c510ba1421b572": "OnrampNotConfigured",
"6e1870cc37dfe469": "OnSale",
"a660823d4a75d099": "Open",
"ca9e4a91f1838324": "Openbook",
"19778ff83bd5de77": "OpenbookV2",
"fce6e6aaad64165f": "OpenBookV2",
"032b3a6a8384c7ab": "OpenbookV2FulfillmentConfig",
"7281d82649d75f73": "Opened",
"62d1eb8e687573e9": "OpenedenInfo",
"7c7106a2f2f03363": "OpenForSubmissions",
"f1815b52dcd4988d": "OpenInterestForLong",
"0d8bded17ecdb6c9": "OpenInterestForShort",
"c72300acce96b65b": "OpenInterestInTokensForLong",
"c708adb5e9dc9c85": "OpenInterestInTokensForShort",
"5464b1110ca28573": "OpenMarketNotEnoughOutcomes",
"e78d6e68e52a85a0": "OpenMarketNotInitializing",
"e9aecc4cb712125b": "OpenOrder",
"ffc24e7b1069d0a5": "OpenOrdersAccount",
"f57031812e21b749": "OpenOrdersCounter",
"0056a026524ca7a8": "OpenOrdersFull",
"c35380d5cc5b1396": "OpenOrdersIndexer",
"9c4f0f55c9747a19": "OpenOrdersOrderNotFound",
"f148f344ca1ee39e": "OpenOrdersPositionLog",
"06dae9771771884e": "OpenPaused",
"7f0402ce8c418cb6": "OpenPosition",
"2005c9be0b8bbab2": "OpenPositionBumps",
"8be0b52aef20398e": "OpenPositionLog",
"96dc7da7cfc5c736": "OpenPositionLogV2",
"f6c4e92a5f653a3c": "OpenPositionLogV3",
"3c1821ddd673cd3e": "OpenPositionLogV4",
"05a65dba69bc05aa": "OpenPositionWithMetadataBumps",
"63745e5438f38bfb": "OpenPositionWithSwapAmountAndFees",
"9b4db63be1bae928": "OpenTokenAccounts",
"ab96c411e5a63a2c": "Operation",
"c047390c317f5aef": "Operational",
"a7f32081cde030c4": "OperationBorrowOnly",
"e67f107b12313a67": "OperationBringsPositionBelowMCR",
"5502d670d044c31c": "OperationCommand",
"76d5818a72dffaba": "OperationCommandAccountMeta",
"4349445580e3da0d": "OperationCommandAccountMetaPod",
"dd7cef5de82ae89d": "OperationCommandEntry",
"a1ff79b047887563": "OperationCommandEntryPod",
"4041f8b1aca3e41a": "OperationCommandPod",
"93cf7e9781765a1e": "OperationCommandResult",
"6ed5c01e8c45432b": "OperationDepositOnly",
"527c0bdaee7a8c6e": "OperationForbidden",
"99027a0c3d37bcd5": "OperationNotPermittedMarketImmutable",
"951eb4e324190ab9": "OperationNotPermittedWithCurrentObligationOrders",
"edc9353bf7d4ea53": "OperationRepayOnly",
"13ec3aed51deb7fc": "OperationState",
"f0efe2b21aae009b": "OperationWithdrawOnly",
"db1fbc91458bcc75": "Operator",
"1cc32a6709269693": "OperatorDonatedToFund",
"15d75f5c8129356b": "OperatorRanFundCommand",
"fc62b1d8cd42618f": "OperatorsAreTheSame",
"74151a0e8e69731b": "OperatorType",
"ad54443949869740": "OperatorUpdatedFundPrices",
"e6b95099d2b74902": "OperatorUpdatedNormalizedTokenPoolPrices",
"f25644bbc318da15": "OperatorUpdatedRewardPools",
"bd398c5a1a36b12d": "OptionalNonSystemPubkey",
"1118daef184e8c36": "OptionalRoyaltiesNotYetEnabled",
"754bb9b2416579bc": "Or",
"8bc283b38cb3e5f4": "Oracle",
"01e82011782f501e": "ORACLE",
"801e10f1aa493736": "OracleAccountData",
"343b0385d7914f1b": "OracleAccountType",
"89f246c93388d76c": "OracleBadRemainingAccountPublicKey",
"4841e05c7359fc7a": "OracleConfidence",
"85c498321b1591fe": "OracleConfig",
"930d7c60e5d5f319": "OracleConfigV0",
"b8662f56fd38413d": "OracleDeserializeMessageFailed",
"cab63c74954f002d": "OracleEpochInfo",
"6e9f2324c8b12828": "OracleFlagContainer",
"1301f263fa0bd005": "OracleGuardRails",
"600b29d54a0aee0c": "OracleInfo",
"a9359f83c989f2f0": "OracleIsVerified",
"562218903080f2c6": "OracleKeyNotFound",
"28f46e50ffd6f3bc": "OracleMappings",
"3c124962ec92e08b": "OracleNonPositive",
"683a9a17d147d024": "OracleNotFound",
"05110c39b9bf449d": "OracleNotOnApprovedList",
"64ec008485d97593": "OracleNotSetup",
"0c4c301d87d3acb3": "OracleNotSupported",
"57bfc3bf7672adfe": "OracleNotUpdated",
"efa80a0296a54d6b": "OracleObservationCount",
"e5c40a92804cf06f": "OracleOrderPrice",
"fff77a0e83f4e2a7": "OraclePegged",
"ba9926c65cee9771": "OraclePegInvalidOracleState",
"47a6e51536f70822": "OraclePrice",
"7176794cf30248a9": "OraclePriceBreachedLimitPrice",
"522277cd275e71d6": "OraclePriceDeviationThresholdExceeded",
"fdd10035654506a8": "OraclePriceDeviationThresholdOutOfRange",
"ab98b205fafe87bd": "OraclePriceDifferenceTooLarge",
"2254487c262b19d8": "OraclePriceIsStale",
"598076dd0648b492": "OraclePrices",
"8b264e9af92cd19d": "OraclePricesSetup",
"f8687fea91bca8b6": "OraclePriceType",
"a5f9d724b67d1e9e": "OraclePublishTimeTooEarly",
"593412291f82892c": "OracleRequest",
"22434ba10d136525": "OracleResponse",
"7605c4ea69dc0808": "Oracles",
"d324ad511f72a368": "OracleSetup",
"317870de6a484660": "OracleSource",
"f2bae3e39670b3d7": "OracleStale",
"7c4ce61a664b682a": "OracleStaleForAMM",
"66d00c07af04991e": "OracleStaleForMargin",
"77f3e56aab0fde73": "OracleStalePrice",
"b49db2eaf01b98b3": "OracleStatsAccountData",
"24317a435bfd86ca": "OracleSubmission",
"55503426dfd94a38": "OracleTooManyPriceAccountUpdates",
"64213b6cfae22e4c": "OracleTooUncertain",
"5cacf649c6dce14e": "OracleTooVolatile",
"c867db3f951d96ca": "OracleTriggerMarket",
"c08b1bfa35a6653d": "OracleTwaps",
"696b4659a52a4b65": "OracleType",
"14b672eee091b2b3": "OracleUnsupportedMessageType",
"1a8e2c6271d55958": "OracleUpdatesNotMonotonic",
"bdd0c59a1e96560a": "OracleV0",
"107b7e191a47e363": "OracleValidity",
"13edf29fa1043afe": "OracleWrongGuardianSetOwner",
"223fd490a4767120": "OracleWrongVaaOwner",
"fcabb22943288399": "OracleWrongWriteAuthority",
"d92a1752cf725bb8": "Orca",
"cd9f0879e7599d4d": "ORCA",
"6890252b479e1e34": "OrcaDEXLiquidityPool",
"0fbb3f65aced2ac8": "OrcaPriceTooDifferentFromScope",
"61b646669e3e3548": "OrcaRewardUninitialized",
"1645448f5fb7188c": "OrcaWhirlpoolAtoB",
"50ec07138ee84399": "OrcaWhirlpoolBtoA",
"7dc4f8da0e4f9fd2": "OrchestratorFlags",
"86addfb94d561c33": "Order",
"4f43709bd60e2037": "OrderAccount",
"d250a2454d065f9a": "OrderAccountNotPopulated",
"fdbdb9604fc0992b": "OrderAction",
"7d3598cea386297a": "OrderActionExplanation",
"861c839b238cc28c": "OrderActionRecord",
"e8f93aa40f69fac8": "OrderAmountTooSmall",
"ed76ea88d04a1ae9": "OrderBitFlag",
"634ddfc2918a8b94": "OrderBreachesOraclePriceLimits",
"32d6d86e44fadf1b": "OrderCanNotBeCanceled",
"1c96a16dbab26935": "OrderCannotBeFulfilled",
"21639dc32f690d39": "OrderConfig",
"ef367d7bead8191a": "OrderConfigurationNotSupportedByObligation",
"864419f037d24921": "OrderConstraint",
"f8ec04788d7d0e14": "OrderCreated",
"9096b77f8d547465": "OrderCreationDisabled",
"2d2f84c725b62b2c": "OrderDestChainIsNotSolana",
"c6812c46a7296c2c": "OrderDestSolanaState",
"818432be42a691d4": "OrderDestSolanaStatus",
"b3e8e4d2809387f7": "OrderDidNotSatisfyTriggerCondition",
"ade2eb6313223939": "OrderDisplay",
"f9f776e00c06715a": "OrderFees",
"0a84d7bfc37cdef9": "OrderFillAmountWrong",
"6d7539c3bd050ef1": "OrderFilledWithAMM",
"7bd42e0d15a77f62": "OrderFilledWithAMMJit",
"0a9564a9c295568d": "OrderFilledWithAMMJitLPSplit",
"73d7334d72976dc4": "OrderFilledWithLPJit",
"59abb958e80c3546": "OrderFilledWithMatch",
"4091b3cdc1e2fae4": "OrderFilledWithMatchJit",
"acf18031177fde3f": "OrderFilledWithOpenbookV2",
"0fa879afe821967e": "OrderFillerRewardStructure",
"e4b39143f880206f": "OrderFillWithPhoenix",
"6f5a4fb1cf199ba6": "OrderFillWithSerum",
"b7e20b957eb88f9a": "OrderFulfillInfoMissed",
"688202c4be975145": "OrderId",
"c3555b60753591b3": "OrderIdNotFound",
"74ceb904ee43432c": "OrderIndexOutOfBounds",
"5911b2a42a6fe3d3": "OrderInfo",
"c2897dfc4b6e815d": "OrderInitialized",
"da65da094ca7d7ac": "OrderInputAmountInvalid",
"e8d7c854f9ca8f55": "OrderInputAmountTooLarge",
"c5046955ce4e66ca": "OrderIsNotClaimed",
"452b7edcf46201e0": "OrderIsNotCreated",
"c0abad47da28d6ae": "OrderKind",
"373438d22b850850": "OrderLedgerState",
"f94272bad0684092": "OrderMatch",
"69068bcff9ce2310": "OrderMustBeTriggeredFirst",
"74a62b5428e99bfc": "OrderNotActive",
"d34896d76d72a42e": "OrderNotAtFrontOfQueue",
"5e1e4608a49dbcb2": "OrderNotFillableAfterLastFillableSlot",
"c4930635d710a4b3": "OrderNotOpen",
"135ae110f5178158": "OrderNotTriggerable",
"d90f7a6875476d5e": "OrderNotWithinFlashOperation",
"1c34f321542c8911": "OrderOutputAmountInvalid",
"71fde99a1daa53b0": "OrderParamsBitFlag",
"8f2c4f8b1bbf72cc": "OrderRecord",
"d54f06a27fef29bb": "OrderRemoved",
"2d69eec4450fe272": "OrderRequest",
"0b8284cbb5e34401": "OrderRequestCreationDuplicateRequest",
"2fe73b99c64233a7": "OrderRequestCreationInvalidPayerTokenAccount",
"ce7185e5cf7b0651": "OrderRequestCreationQueueFull",
"a7b23719616cabe4": "OrderRequestData",
"198ad59928660159": "OrderRequestQueue",
"b6f5be557da977b0": "OrderRequestQueueIsEmpty",
"26f37fa69aee2f10": "OrderRequestQueueIsNotEmpty",
"f192868126716ca5": "OrderSameMint",
"7dd33bb069cd0030": "OrderSide",
"d8798344d7201c23": "OrderSizeBreached",
"adc21663eea8f564": "OrderSizeTooSmall",
"fba6bc8ecd47efcb": "OrderSourceSolanaState",
"3c7b43a2602bade1": "OrderState",
"2e5af149b2684103": "OrderStatus",
"cfbc80ca1b9d88f0": "OrderTakingBlocked",
"9386b1ea6ac72dff": "OrderTokenAccounts",
"5cc5cb7427d0435a": "OrderTreeNodes",
"50bbe28826fd8531": "OrderTreeRoot",
"97a7db8f992aead9": "OrderTreeType",
"701115e2733e2498": "OrderTriggerCondition",
"08dbf51270f360a7": "OrderType",
"114c40cc251994bb": "OrderTypeInvalid",
"77d5772200cef3d6": "OrderUpdated",
"fd625fd033c79f58": "OrderV1",
"f6703ac493ed6084": "OrderWithinFlashOperation",
"912698fb5b3976a0": "Organization",
"bf5bc0ac38ed2493": "OrganizationConfigurationNames",
"ab3274a899108c12": "OrganizationHasNoAmbassador",
"f3bd7ebf3b48ff44": "OrganizationV0",
"23a3a4f9eeb1cb4e": "Original",
"4df0bfc94a54595e": "ORIGINAL",
"36b97e14c430f679": "OriginalDataStatusInvalied",
"06d3b6dbd48dfdc8": "Other",
"a342e5cc559a9be6": "OTHER",
"9c51dfb431305961": "OtherStablecoinWithdrawalCap",
"f90518256457410b": "OtherState",
"51350a6735f05396": "Out",
"013840c0117955f9": "OutAmountsStackIsEmpty",
"2617100b8b3fe222": "OutboundRateLimit",
"9b931c22c6fd04ba": "OutboundXChainTradeReceipt",
"081a7e4479ccbcc6": "OutboxItem",
"5a3600482fba1b58": "OutboxRateLimit",
"bc6c20a347600f91": "OutdatedBalance",
"14b9197b8d819943": "OutdatedDelegatorAccounting",
"e20c50edd60ed22c": "OutdatedPrice",
"3a2dcf87d7574522": "OutdatedPublisherAccounting",
"265302e5b7dacf1a": "OutdatedPublisherCaps",
"68719ac4401e55e4": "Outer",
"4969cfe180e234d2": "OutFlowsSuspended",
"09b3bc61ac01f035": "OutOfBoundsDepositEntryIndex",
"f048cfdf7ddde39d": "OutOfBoundsVotingMintConfigIndex",
"23c6c334f1bc8776": "OutOfPool",
"c27760878c1d6b14": "OutOfRangeIntegralConversion",
"e5c5ca812b7161ea": "OutOfRangeOfReserveIndex",
"fc3951fe25e144b1": "OutOfSequenceInteraction",
"db0982888e8fad31": "OutOfSequenceUpdateProvided",
"b5aa1c84a3ec5d7b": "OutputAmounts",
"b065c48d0cb183d6": "OutputCompressedAccountWithPackedContext",
"21511f13f4b3de32": "OutputExceedLimit",
"1b601183acc8f4d3": "OutputIsLessThanPromised",
"3ff3b222b4bc0ade": "OutputMerkleTreeIndicesNotInOrder",
"50251633fa383385": "OutputMerkleTreeNotUnique",
"a70988876600095e": "OutputTooBig",
"db660bdc86189172": "OutputTooSmall",
"029eb77674b2bb42": "OverCapAmount",
"07211801b4ab7f0b": "OverCraftingFacilityCapacity",
"9aafc34564625e78": "OverliquidationAttempt",
"6a366f09b2943a80": "OverrideCurveParam",
"a5f4f65f8178e09b": "Owner",
"515c414e708cedfb": "OwnerMustBeSystemAccount",
"ef1c514bb4c89bad": "OwnershipTransferred",
"545dc8fba26ae0b3": "OwnershipTransferRequested",
"c575334fb0ef6d77": "OwnershipTransferStarted",
"1da8814191a4efba": "OwnRewardUninitialized",
"dc7f11a050faf889": "PackedCompressedAccountWithMerkleContext",
"94a17221a747ea52": "PackedMerkleContext",
"dfe8a99f83f24513": "PackedTokenTransferOutputData",
"3c8c22f2d039ad5b": "Packet",
"a967c89e34fc182b": "PackTiers",
"39cb3822d4419003": "PackType",
"2086b8c5a1cd18f9": "Padding",
"e01c92d5ccbb0b03": "Paid",
"554831b0b6e48d52": "Pair",
"139a9428ec33fbc1": "PairAuthorityType",
"d18b92dc3d746468": "PairBumps",
"aa2af4a70a1b6132": "PairScopeValidationNotSupportedForNow",
"e5d4dedebf80b0eb": "PairState",
"088bc7fe1e31ded5": "PairStatus",
"145e888cbdddc2bb": "PairTokenType",
"2ba5bf8206e9fb5e": "PairType",
"2ed58661756a71b4": "PairValidationType",
"6881b13b66a79e26": "ParameterDefinition",
"e902196d46e4cee4": "Parameters",
"e6b0ce795026db3b": "ParamIndex",
"7a0b70984f11ac24": "Parlay",
"34207b937914413c": "ParseScopePriceAccountFailed",
"467de6837c081f45": "Partial",
"60fdb4fd91c23502": "PartialFill",
"b71ec82074f04ae8": "PartialSettings",
"ac923ad528fa6b3f": "PartialUnstaking",
"56e6afeb13514d50": "PartialUnstakingAmountIsNotZero",
"0a8f9085d4500016": "PartialUnstakingIsNotEnded",
"e462ed9ed597950f": "PartialWin",
"7a2bf6ef8d38f3b6": "Partner",
"8a792fca0f9d0976": "PartnerClaimFees",
"e7eaa2df54eaa63f": "PartnerInfo",
"4444821310d1629c": "PartnerMetadata",
"cfc411bb714116e6": "PathNode",
"a8b7fce11c118aae": "Pause",
"38ef5462ad88edef": "Paused",
"59086098cd93e42e": "Pauser",
"411973489734c5d2": "PauserChanged",
"0857b2e8e42972c1": "PayAmountIsExeeced",
"32d62a924e966cf8": "PayDebt",
"601c6a916720ba46": "PayloadHash",
"f5ab248169a836e0": "PayloadHashNotFound",
"6f53792f9ac4cf48": "PayloadTypeLocal",
"2fefda4e2bc1013d": "PaymentAccount",
"7403ea4ecbb4b692": "PaymentAccountHasData",
"8d63ec4d1408d4af": "PaymentFrequency",
"8f7dc0c690c33aaf": "PaymentInfo",
"fc9e05d554793b50": "PaymentQueue",
"3274d7cac9cb3232": "PayoutAmountInvalid",
"76cfc68f618c7df2": "PayoutNotFinished",
"7cf6c19a378eef8c": "PayoutTokenInitialSupply",
"4a8f84a7abcbfa54": "PayThenRedistribute",
"9d1c5306fb0b1c48": "PDA",
"2e18a272c37abe3e": "PdaPlacoholder",
"3208133728fd253a": "Peer",
"888834586b612ebc": "PeerAddress",
"b59d56c621c15ecb": "PeerConfig",
"a93c924d80fd7c12": "PeerConfigParam",
"7fa9d97006414311": "Pegged",
"13905fffb35539ce": "PeggedToken",
"24b493aa48afad7e": "Pending",
"dc2d8710c499b538": "PendingAdmin",
"1928044625d6d286": "PendingAuthorityNotSet",
"74371cd0580a0f2d": "PendingCollection",
"aab05ff078e7f1da": "PendingInboundNonce",
"54b5e57b8d57a5da": "PendingRound",
"cd534e8ec9d80ff3": "PendingVaultAdmin",
"3dc52d3ff59f0f62": "PendingWithdrawalNotWithdrawnYet",
"f090890822839116": "Percent",
"a5062959277cb8bf": "PercentItem",
"b7581463f62e33e6": "PerChainPerTokenConfig",
"c521904e950564dd": "Perena",
"d77b22354264ebb7": "PerformanceFee",
"a70a7cdde54879cc": "PerformanceFeeBps",
"ee18132b72d2fcd4": "Period",
"530ead6b87fc6159": "PeriodicRebalance",
"0fc14880bb152431": "PeriodicRebalanceState",
"dd24eeb1308497fb": "PeriodicVesting",
"d92a6664a567e635": "PeriodicVestingAfterListing",
"e7c241e99017c074": "Permanent",
"f9183ebdc0b326bb": "PermanentBurnDelegate",
"46da3a124ee661d9": "PermanentFreezeDelegate",
"620f0a2f382794c5": "PermanentTransferDelegate",
"e0531c4f0afda11c": "Permission",
"1cfa8d25de409036": "PermissionDenied",
"c9978a881705108c": "Permissioned",
"9bbd56f659da8f1b": "PermissionedAccount",
"1a4337ab14562236": "PermissionedVault",
"18d3c941183544d3": "PermissionedVaultCannotChargeEscrowFee",
"c13637ea0d7df69b": "PermissionedWithStaking",
"5bb12748befaab44": "Permissionless",
"255c934efa649389": "PermissionlessFarmSwitch",
"29c8acad260d2118": "PermissionlessOracleMalformedEd25519Data",
"0317df57845c24d3": "PermissionlessOracleMissingSignature",
"3e28d052b4287bcc": "PermissionlessPythCache",
"a5a062749ec2c6fe": "PermissionlessRebalancingDisabled",
"1e1028dc35b48cb9": "PermissionlessV2",
"595de6240b0726fc": "PermissionlessWithStaking",
"c58fad5c6f327fdf": "Permissions",
"2c4b3e15041217d0": "PermissionStatus",
"dbc3baaec5e853a0": "Permit",
"d31445f63ade0e53": "PERMIT_SEED",
"c0f68b3f45ba58c4": "PermitConfigured",
"acb23b03ea3ea7f1": "PermitNotOwned",
"6b086496d2ee1807": "Perp",
"997911c0868818e5": "PerpBankruptcy",
"0bc89e9408730113": "PerpBankruptcyRecord",
"3bf4820db9660c49": "Perpetual",
"1ca762bf68526cc4": "Perpetuals",
"4e7b8fffa3ba4c0a": "PerpetualsAddLiq",
"90679b419728ca06": "PerpetualsRemoveLiq",
"8a1b463f4cd8e049": "PerpetualsSwap",
"75ae89f7ec7e3461": "PerpFulfillmentMethod",
"0adf0c2c6bf537f7": "PerpMarket",
"f2b38edea77201d4": "PerpMarketNotFound",
"35b7f7cfe92c5401": "PerpMarketNotInReduceOnly",
"82040c9f95839796": "PerpMarketNotInSettlement",
"60fa36b317781fff": "PerpMarketSettlementBufferNotReached",
"1949e677c2f47c06": "PerpMarketSettlementUserHasActiveLP",
"2bdc1d109b970d8d": "PerpMarketSettlementUserHasOpenOrders",
"d231b60586e014e2": "PerpOperation",
"09605f4b7f2b6a9c": "PerpPnlDeficitBelowThreshold",
"311bb5cf809ab02d": "PerpPosition",
"d00db58af12db41e": "Perps",
"41acea4319b881e8": "PerpsAddLiquidity",
"97a7254d707e07f5": "PerpsRemoveLiquidity",
"5ead1a52a74ac2d3": "PerpsV2",
"924aa1e7f64ac07a": "PerpsV2AddLiquidity",
"6c8bfc823d3d774f": "PerpsV2RemoveLiquidity",
"6f077b3b86d2c399": "Persistent",
"6703f468be2ca40d": "PersonalPoolAmountLimit",
"466f967ee60f1975": "PersonalPositionState",
"5be6394e3d8666be": "Phoenix",
"d175b66a8cc509b1": "PhoenixSwap",
"eba60a5059e7164e": "PhoenixSwapOptions",
"252e9a703561ef74": "PhoenixV1",
"e92d3e2823813048": "PhoenixV1FulfillmentConfig",
"a978b9fbc3fc39c1": "Place",
"5ff69e5ce551b254": "PlaceAndMake",
"4f9e506c99cfa0e0": "PlaceAndTake",
"596562b146a36da2": "PlaceAndTakeOrderSuccessCondition",
"69da28a0f91f8e46": "PlaceAndTakeOrderSuccessConditionFailed",
"778896e4636b1721": "Placeholder0",
"891dc97dbf9745cc": "PlaceholderOne",
"1f34a1072385830c": "PlaceholderTwo",
"520ed78d7d2fc4cd": "PlaceLimitOrderLog",
"38dd3fcf983a43f1": "PlaceOrderType",
"3338f0b2f8505a26": "PlacePostOnlyLimitFailure",
"5fdcd18f4800d2cf": "PlaceTriggerOrderLog",
"f21bec2adcd98480": "Planet",
"96bdcd67866213c4": "PlanetNotReachable",
"a3c90817f0211bf6": "PlanetType",
"573bebe682c17c3b": "Plasma",
"a04e8000f853e6a0": "PlatformConfig",
"d2ad054472dbed6a": "PlatformConfigParam",
"2ad4e2a8987b6a11": "PlatformFeeWrapUnwrapArgsV2",
"cdde7007a59bceda": "Player",
"ee9895d3ca702ae2": "PLAYER",
"9442ad9c81ca3ba6": "PlayerAdvantage",
"ddb930074bc426db": "PlayerCrewRecord",
"c541d8ca2b8b9380": "PlayerData",
"9cbe9f39bf48b426": "PlayerIsBanned",
"971dca4ff597157c": "PlayerIsNotInTeam",
"6609f16260c4d4a1": "PlayerName",
"09342df077b85870": "PlayerTeamApplicationListFull",
"55cb7667983cc3df": "PlayerTeamApplicationNotFound",
"158b7448a7865fe6": "PlayerToken",
"6fd4e718b8c64311": "PlayerTokenAccountCannotBeClosed",
"ac328bca531b19c7": "PlayerTokenDeposit",
"6f0ff2095297fdef": "PlayerTokenInteraction",
"0672f40b980bdd79": "PlayerTokenWithdraw",
"df01696fe962e040": "PlayingCardRank",
"83270cd55d822ea0": "PlayingCardSuit",
"c37c97d3cb4de5ac": "PledgedLiquidationAmountLessThanMinimum",
"1ee71cb9599997c0": "Plinko",
"c90178e1e1632b1c": "PlinkoPaytable",
"03c758e078ceefe1": "Plugin",
"e41ee3709fb13333": "PluginAuthority",
"67861badf3d61e2e": "PluginAuthorityPair",
"ed32a5d026fd9998": "PluginHeaderV1",
"a916f6dce5e5a4cc": "PluginRegistryV1",
"2531364cd6b3eda3": "Pnl",
"7de551f2602de25f": "PnlPoolCantSettleUser",
"d39d65b3db85bdd7": "PnlTokenToCollateralToken",
"abf26fe953afe789": "PointAndTimeDelta",
"f80754ca32688f22": "PointCategory",
"84510c92ffe961f2": "Points",
"dfd3773f0b2961d8": "PointsLevel",
"2020dc32e87f90b0": "PointsLevelLicenseType",
"bfe3d9b23acd2c27": "PointsModifier",
"271d191215c38ac4": "PointSpreadOver",
"a58b6267cd4afa7c": "PointSpreadUnder",
"90c32ec979c333fc": "PointsStore",
"de8707a3ebb12144": "Policy",
"f19a6d0411b16dbc": "Pool",
"c37c0077cc1c05f0": "POOL",
"b2e1b67c6994016d": "POOL_SIZE",
"74d2bb77c4c43489": "PoolAccount",
"2223124a8bcf8de6": "PoolAction",
"efbae98fcd28925c": "PoolAmountLimit",
"acdad97c5802ae66": "PoolApr",
"d76f25ade311fe25": "PoolAumSoftCapUsdReached",
"22e7a0e1853554e5": "PoolBalance",
"1f85fc9f20e3a881": "PoolBalanceUpdatedData",
"f967f3abd22084d7": "PoolBased",
"3ed942d9551a6837": "PoolChange",
"1a6c0e7b74e6812b": "PoolConfig",
"086d369290fef9b6": "PoolConfigured",
"49f67f98ae10e30c": "PoolCreated",
"9b1cdc25ddf246a7": "PoolData",
"db3567b1d5581d51": "PoolDisabled",
"96ff5cef74af55f6": "PoolEmpty",
"b5e8c945f1bcede1": "PoolEnabled",
"d64ab2a9093ab1c3": "PoolFeeParameters",
"33ecbe9be578ee36": "PoolFees",
"0b7e76f146d24e58": "PoolFeesCompounded",
"2b1c1d715dfceb7a": "PoolFeesConfig",
"855738f82034341a": "PoolFeesStruct",
"1d23e1978c923692": "PoolFrozen",
"7c60309ea094452a": "PoolFull",
"715298031e237c35": "PoolFunding",
"92b16ea0ece0d781": "PoolHasStarted",
"1213bf3cf48bb1eb": "PoolInfo",
"a9428108e3ebe3bd": "PoolInfoSnapshot",
"8050e042a1ed0c4e": "PoolInitialized",
"5652d655931eeea9": "PoolIsClosed",
"b28dfeac62730a78": "PoolIsCompleted",
"129ae6e14b27183d": "PoolIsIncompleted",
"15fdaa70dfdf6ea0": "PoolIsNotClosed",
"d160c64b1764f3d2": "PoolIsNotInPreClosure",
"e4390ad9150b7f73": "PoolIsNotLaunchPool",
"767a503ad08c0c7b": "PoolIsNotOn",
"2142718911a10433": "PoolIsNotOnOrInPreClosure",
"59f0f4c2ff2e6785": "PoolIsNotPermissioned",
"12b97920d58de243": "PoolKind",
"474603ede76e734f": "PoolLiquidityState",
"44e35106cf9820c9": "PoolMarginated",
"a41dd7be2951c9b7": "PoolMetrics",
"574b9bf837177f56": "PoolMigrated",
"605ae82c3e1192b3": "PoolNameTooLong",
"6ab594a6edc25566": "PoolNotMarginated",
"f859f7fbf7c01f5e": "PoolNotMigrated",
"ed91b848c9a9e976": "PoolOnSharedEscrow",
"565d51a285bd50bf": "PoolOperator",
"8262e2e79e312ce7": "PoolPartnerInfos",
"53ffd8be19741b03": "PoolPrice",
"60982e3a3f2b514c": "PoolPriceCorrected",
"78aacfac81aa6995": "PoolPriceOutOfRange",
"6588e037c6dfcdac": "PoolRebalancing",
"6bd8bca11e2f9709": "Pools",
"e91bfeecfc59d95c": "PoolsAreTheSame",
"0754ee7c1e2a4a71": "PoolSettings",
"f7ede3f5d7c3de46": "PoolState",
"18b4a234257ac462": "PoolStats",
"cb9db5c6ea0248cf": "PoolStatus",
"4e5653206a93447b": "PoolStorage",
"8f23962e54636146": "PoolToken",
"23bee6af4b720965": "PoolType",
"1812944a0bb1cd83": "PoolTypeIsNotSupported",
"22f8fe6698cfccea": "PoolUpdatedData",
"2015a798332ea8ed": "PoolUserAccount",
"5b0cd65707b9a737": "PoolV2",
"8d274f657f0e8f6b": "PoolVaultTokenA",
"269ee245247081b7": "PoolVaultTokenB",
"291fa4162dce604c": "PortFinanceWithLM",
"b6ce0b97d5a62d99": "PortFinanceWithoutLM",
"aabc8fe47a40f7d0": "Position",
"2707359ed3016647": "POSITION",
"00b9fa9b69d81af5": "POSITION_MAX_LENGTH",
"5a524fcf9a09091c": "POSITION_SEED",
"5b99cfaea6986398": "PositionAmountLimit",
"81a9af41b95f2064": "PositionBundle",
"c9facbf1c7c59ed9": "PositionBundleNotDeletable",
"1388975c35d81fff": "PositionChangeWhileDelegated",
"a635b38ae5249b74": "PositionClose",
"86bfc01f6a5f5dca": "PositionCompleted",
"1d2412daa564a791": "PositionCreate",
"55c3f14f7cc04f0b": "PositionData",
"c81801831cf8f226": "PositionDecreased",
"ef1563f9c418738d": "PositionDirection",
"8806d20c53a04d7c": "PositionFees",
"06085038492aeeea": "PositionHasRemainingLiquidity",
"e8d0c0ea4b814155": "PositionImpact",
"ff9175ca3c6428a9": "PositionIncreased",
"e95b4fd6c82d1447": "PositionIsHealthy",
"1cfb9acb6b001375": "PositionIsLiquidated",
"3bdef3d536f4a6db": "PositionIsNotEmpty",
"7f118c9679e32753": "PositionIsUnhealthy",
"ccdcfd7bc67bc3a9": "PositionLimitBreached",
"6cb04b8674b47f09": "PositionMetrics",
"fe8811f8c2bfdcf3": "PositionNotActive",
"d8bbe5848e0e84e1": "PositionNotEmpty",
"5851680b42b640ab": "PositionNotInLiquidationRange",
"1cb473bc27e09979": "PositionNotInUse",
"628b543b089a357e": "PositionNotLockable",
"a89f307fe0b40229": "PositionNotRegisterable",
"0eea264d8ec8288d": "PositionNotRegistered",
"c717b2163b54c11c": "PositionOutOfBounds",
"0c26fac72e9a20d8": "PositionRequest",
"78487965d5728561": "PositionRewardInfo",
"c59947cb85b077b6": "Positions",
"5940dff0b1daa09e": "PositionsAccounting",
"fcf2d3dc27543d38": "PositionSerDe",
"9a2f97460880cee7": "PositionState",
"cb3a347f16116e13": "PositionStats",
"77f6bec6b29e103e": "PositionStatus",
"bd9934e38c8afdf4": "PositionTokenMetadata",
"15b50c86c5302caf": "PositionTokenMetadataConfigured",
"81ebda29accfefe8": "PositionTooYoung",
"e7989ba3db628744": "PositionUpdatedTooRecent",
"35dd774805f59b17": "PositionUpdateType",
"98839a2e9e2a1fe9": "PositionV0",
"75b0d4c7f5b485b6": "PositionV2",
"08935abab938c096": "Post",
"3c127e59f9513e8b": "POSTED",
"847bcca773b7f007": "PostedMessageV1",
"b387802af0d85bbb": "PostedMessageV1Data",
"8d5d48c4dcff8253": "PostedMessageV1Info",
"1a5e2b6ca5a1edb7": "PostedMessageV1Unreliable",
"ac139d0fd65de8c6": "PostedVaaPayloadTooLarge",
"b1b488bdf985c074": "PostedVaaV1",
"3a1ba0a4d039fe05": "PostedVaaV1Info",
"7321591cfccdffc5": "PostMessage",
"a98b14d55bc24831": "PostMessageUnreliable",
"f4b55d8e24ae5cf9": "PostOnly",
"10aa6632037d11eb": "PostOnlyParam",
"4e22c2882f80bde7": "PostOnlySlide",
"ca9f3b1c91b6711b": "PostOrderType",
"d9850e389b5d202e": "PostPriceDataCannotBeDeserialized",
"7c5a09e70e2a186d": "PostPriceNotVerified",
"78aff33efdc10017": "PostPricePublishTimeInvalid",
"773fa72dac1bda83": "PostPricePublishTimeTooOld",
"02f925dc0f3b2f3f": "PostPriceUserKeyNotMatch",
"9665da5d54fe0c4d": "PostUpdatePriceMeta",
"ae533f9bf83c921b": "PostUpdatePricesParam",
"9d5da24d75cc19c2": "PostV2",
"d207cfb7979cbe57": "PostVaa",
"6228a0e82277e1da": "PotentialPayoutExceeded",
"7247eb53fe4dd407": "Pre",
"e976fdc782abaa4f": "PreActivationSwapStarted",
"3b7ec9a0d4ab715b": "PreBalanceState",
"43706cb87ac21f4a": "PrecisionMath",
"e035a1ebe1aa6b1e": "PreClosure",
"d63ffe393f1330c4": "PreconditionsAreNotMet",
"ddc3d4f60b283617": "Predelegated",
"627f8dbbda21080e": "Prediction",
"2ddd446887e791b5": "PreferredValidatorType",
"0043286b67c76e58": "Prelaunch",
"5c0e8bea48f4441a": "PrelaunchOracle",
"86e32b9c4b7d2d43": "Premium",
"1a003f96387c766a": "PremiumMultiplierWeiPerEthUpdated",
"f5678bf0e5215a8d": "PrepaidCardBuyer",
"7a3cea6c506136c3": "PrepaidCardDirectPurshase",
"ecdcea6ff4f74eeb": "PrepaidDigitalCardPurshase",
"d0f1fd926b36a0b0": "Prepare",
"99db934112fc3a60": "PrepareCompound",
"da8dc10523485bf9": "PrepareDistribute",
"a91850ea5b257b7b": "PreparedMessage",
"1f820a9115f6246b": "PrepareRestakingVaultUpdate",
"bda370018e4f60a3": "PrepareSwap",
"7e4b70e8157f5971": "PrepareWrappedTokenUpdate",
"3eba206e3e17c77c": "PRESET_PARAMETER",
"5439f9870824122a": "PRESET_PARAMETER2",
"f23ef422b5703aaa": "PresetParameter",
"abec9473a271deae": "PresetParameter2",
"326b7f3d5324274b": "Price",
"32ab45bce1d19abf": "PriceAccountIsFull",
"7938baec29ead3fa": "PriceAccountNotExpected",
"7e5e1007c3e404df": "PriceAndFee",
"29e27cd8f4fd63bc": "PriceBandsBreached",
"8d1a58fdcbeef308": "PriceBased",
"11f713ab60d543db": "PriceBias",
"8604fe0d65081a6d": "PriceCalcMode",
"08373f4506e419a7": "PriceChainConversionFailure",
"25d2a5d73b1a0106": "PriceChainTooLong",
"8496ce0ebba28623": "PriceConfidenceTooWide",
"e871c1e785d1ce9a": "PriceData",
"2e58ac90acdb1935": "PriceDiffTooLarge",
"1c5d437414862eab": "PriceDivergenceGuardRails",
"bd67fc179823f39c": "PriceFeed",
"6810ec1e76ac72d6": "PriceFeedMessage",
"70709732e18b4516": "PriceFeedNotUpdated",
"11cae93200ad791f": "PriceFeedPaused",
"d3f227b29d119dfe": "PriceFeedPrice",
"b1dd4e020350d777": "PriceFlagContainer",
"f9b25e1e9ab46627": "PriceHeuristic",
"3f3878097ea26588": "PriceImpactBuffer",
"575c42ee13e160c4": "PriceImpactMechanism",
"e1a5c28bd839c425": "PriceIsBiggerThanHeuristic",
"2179e6313a26260e": "PriceIsLowerThanHeuristic",
"46b53ab3d4aabe8a": "PriceIsStale",
"745c54603e9e2a6d": "PriceIsZero",
"73c5359092682d26": "PriceLadder",
"4661134de91791ba": "PriceLadderIsFull",
"6daede43cf574249": "PriceLadderSizeCanOnlyBeIncreased",
"a13165723e17144f": "PriceLimitExceeded",
"799c83b473376779": "PriceMap",
"625ee96866e41acc": "PriceMapEntry",
"879b5d680fc783ff": "PriceMeta",
"fe60ebc2f78cdea0": "PriceNotValid",
"cbc8b4fe7f90bbbc": "PriceOneOrLess",
"831b75fafab2c43c": "PriceOracleV0",
"b1b3c10ebc40635d": "PricePercentage",
"91493e81e3849de0": "PricePercentageWithReset",
"8a125892a8db2f05": "PricePrecisionTooLarge",
"11e01c8830c84973": "PriceRangeViolation",
"4a19194638622715": "Prices",
"48b4ab84f0d3aa94": "PriceSlippageCheck",
"0eed0c13aba86ac2": "PriceStaleTolerance",
"94da232b602e8b05": "PriceTooDivergentFromTwap",
"ea8e92f0205f62f3": "PriceTooLow",
"1945c41dff431687": "PriceTooOld",
"7b229e20cf6170ab": "PriceType",
"a2c8172b1d58a1c7": "PriceUpdaterAdded",
"09479eda4c3d8370": "PriceUpdaterRemoved",
"b822ac049d6d590e": "PriceUpdates",
"22f123639d7ef4cd": "PriceUpdateV2",
"6e636eda54d0a27d": "Primary",
"c9582317f3f190b1": "PrimarySaleCanOnlyBeFlippedToTrue",
"7e4fa0b74d73f626": "PrismData",
"264673266369aecb": "PrivateFund",
"7a84d66381598688": "Privilege",
"b66bcc3f10ca2aa5": "PrizeV0",
"a7742bef9bed8226": "ProcessingStatus",
"a5919df8cf656c37": "ProcessStatus",
"b5fbe48a3fc76729": "ProcessWithdrawalBatch",
"c2be65dcea9ee15f": "ProcessWithdrawalBatchCommand",
"325434b2af2ef945": "ProcessWithdrawalBatchCommandResult",
"b46ea9c51d3b10e1": "ProcessWithdrawalBatchCommandResultAssetReceivable",
"bb636a71db654b1e": "ProcessWithdrawalBatchCommandState",
"664c37fb2649e0e5": "Product",
"3a5c94e67b5d10d5": "ProductMatchedRiskAndRate",
"b865a5bc5f3f7fbc": "Profile",
"0e9577f391f04fe3": "ProfileFactionAccount",
"504f5bf8431d3253": "ProfileKey",
"32c3559be4b7af8a": "ProfilePicture",
"96abb17d5865b24c": "ProfilePictureNotUnlocked",
"2d02566f6e790501": "ProfileRoleMembership",
"7c4440146482f31c": "ProfitAndLoss",
"546da9bd24d4cad3": "Program",
"aeba47082c7a56e7": "PROGRAM_EMITTER_SEED_PREFIX",
"eee2adacc039dde7": "PROGRAM_ID",
"16e9c1cca5c9ffc8": "PROGRAM_REVENUE_ADDRESS",
"8c6de3740cc08adb": "ProgramAccessInfo",
"13c7db5b6818408d": "ProgramAccount",
"7fd02c356ba32220": "ProgramAllowList",
"393c788f2e7e3bce": "ProgramApprovalV0",
"c4d25ae790958c3f": "ProgramConfig",
"014092413248c7b3": "ProgramDenyList",
"d13d75187746f774": "ProgramFrozen",
"92c3b8a2cacb3584": "ProgramGate",
"4a3c58dbe5da7986": "ProgramIsFrozen",
"354d87b6c6c2bb95": "ProgramIsPaused",
"1a4cded1f0160dc5": "ProgramMessage",
"057f6626f5253d31": "ProgramNotWhitelisted",
"d99aca73ffddb4e6": "ProgramPaused",
"e09c815f0f1d84d0": "ProgressionConfig",
"ec983305228a6e54": "ProgressionItem",
"acf53cfcc0c2c055": "ProgressionItemInput",
"44ca1b3219749e7c": "ProgressionItemInputUnpacked",
"1febcc9faf02b32a": "ProgressionItemType",
"0027439f1f759399": "ProgressionItemUnpacked",
"cda8bdcab5f78e13": "Project",
"ae6d79dcc1509479": "ProofData",
"722c8b4227d0d8e6": "ProofInfoLocal",
"40be2b5d85b8b18f": "ProofIsNone",
"9eae1319ff2db124": "ProofIsSome",
"9c671a9ecf2f1b52": "ProofTooLong",
"2cb3b5f6b86b98f2": "Proportional",
"1a5ebdbb74883521": "Proposal",
"a229d2c8cdb1e40b": "ProposalConfigV0",
"6f557ff4b17513b3": "ProposalCreated",
"c2567bac921cbff4": "ProposalData",
"8a273edb21bc292c": "ProposalForAnotherMultisig",
"ff66eb822bc87609": "ProposalNotActive",
"fbd181cedec7f81d": "ProposalState",
"ba9b176827558b90": "ProposalStatus",
"b175e9d8fdb83ca8": "ProposalTooLong",
"fec210abd614c051": "ProposalV0",
"2aa1d6d7032060c4": "ProposalVotersWeightCast",
"9db477a18a1a8eff": "ProposedOracle",
"cb2230b9497507d7": "ProposedOracles",
"7928c0417eb36bcd": "ProrataConfigParameters",
"5dd6cd6877093398": "ProrataVaultConfig",
"393b4b990eeaf78c": "ProrataVaultCreated",
"f15ee049ac25e376": "ProrataVaultParametersUpdated",
"b236789f191f7c8e": "Protected",
"784fb05f7fcb6ec2": "ProtectedAccount",
"1bca4d3c18ec88c6": "ProtectedAssetTierViolation",
"2f565a09e0ff0a45": "ProtectedMakerModeConfig",
"253a27167df75831": "ProtectedMakerOrders",
"2d27652b73488328": "Protocol",
"e6f08fbb71295a5d": "PROTOCOL_CONFIG_PDA_SEED",
"b8074a04f083f2f0": "PROTOCOL_SHARE",
"43a581661fb5c191": "ProtocolAdminMultisig",
"cf5bfa1c98b3d7d1": "ProtocolConfig",
"60b0ef9201fe6392": "ProtocolConfigPda",
"3fa9cf00e034c973": "ProtocolEpoch",
"797f628b486e2c76": "ProtocolFee",
"816510a9f3ef0ba0": "ProtocolFeeIsOutOfRange",
"24888f39ce110426": "ProtocolFeeMaxExceeded",
"ad6bbe1e9a2b1c23": "ProtocolFeeNotEnough",
"0c8dc065d5993f27": "ProtocolFeeRateMaxExceeded",
"bb13f5141503978d": "ProtocolFeeRateTooHigh",
"bc01d56217941e01": "ProtocolIfSharesTransferConfig",
"44804e4ab578506d": "ProtocolIsNotSupported",
"24d70880e2bc26d2": "ProtocolIsPaused",
"ce7c34419de079c8": "ProtocolOwned",
"64e2916392daa06a": "ProtocolPositionState",
"1f40621b71f46130": "ProtocolSettingsV1",
"c8a7c5ee208b1a45": "ProtocolVault",
"a4b447114bd850c3": "Provider",
"04f5fa4c6d3a1dcd": "ProviderConfig",
"24247b239e594b29": "Proxy",
"bb168fadc9442240": "ProxyConfigV0",
"3bec3bc571e54fed": "ProxyEscrow",
"240534341c3c6721": "ProxyIsPaused",
"53e1b978b91fc8b2": "ProxyMarkerV0",
"7ec5c127884262d7": "ProxyOrderRequestData",
"fe7dce03dd52fc0a": "PsmBurnBlocked",
"802fcb404872ec2e": "PSMCannotBurnZeroAmount",
"e04d1cf77d61cf9a": "PSMCannotMintZeroAmount",
"b6985e964815e15d": "PsmMintBlocked",
"c5aad79c7535781a": "PSMModuleOutOfOtherStable",
"99468c7144bc5dbd": "PSMModuleReachedCapacity",
"d442957ba91ae315": "PsmOperationType",
"033734b2e1c4da7a": "PsmReserve",
"3fda37ea6a92f293": "PsmTreasuryOtherStable",
"0251713fa931b350": "PsmVault",
"2b157d190a0a0dc3": "PsmWithdrawalCapType",
"197fe533833b678c": "PSol",
"a1ee02ea53421cd7": "Pubkey",
"2b22e87d5026fee9": "PUBKEY_DEFAULT",
"f15b28556912396e": "PubkeyValueChange",
"81ddfd180d5cf916": "PublicKeyAmountMissmatch",
"5f0c04db221b9d70": "PublicKeysShouldBeUnique",
"2988ca9a64621e97": "Published",
"05579b2c795a2386": "PublisherCaps",
"4c94f28fec0d29c0": "PublisherEventData",
"188f063eeba262f9": "PublisherNotFound",
"60772592a5e191fc": "PublisherOrRewardAuthorityNeedsToSign",
"54a74685f748e794": "PublishMessageDirective",
"ccca3b6a40d55f23": "PublishTimeMustBeSecond",
"c41b6cc40ad7db28": "PullFeedAccountData",
"3fe867763ea7e2ea": "PullFeedValueEvents",
"1270cefbb3a79d40": "PullOracleNotVerified",
"374d89721aaee493": "PullOraclePublishTimeTooEarly",
"57d8b409e07fb3f0": "Pump",
"52ef7d65068e4db8": "PumpdotfunAmmBuy",
"b04b5210b60e7995": "PumpdotfunAmmSell",
"40bfc9b210885ed7": "PumpdotfunWrappedBuy",
"867b0092543c1ffd": "PumpdotfunWrappedSell",
"82e6cdff98045a2d": "PumpfunammBuy",
"a12dcf1a4f6aa37b": "PumpFunAmmBuy",
"8a84444d762a5b79": "PumpFunAmmBuyOptions",
"66f0724eef0d900c": "PumpFunAmmCreatedFeeAta",
"4540fc38423bd5c5": "PumpfunammSell",
"b28b963e91123777": "PumpFunAmmSell",
"e3710413c09e4cc8": "PumpFunAmmSellOptions",
"74a07a9e6774d684": "PumpfunBuy",
"9cae446c6647ec8d": "PumpFunBuy",
"a274c822751d788f": "PumpFunBuyOptions",
"671093f5e6240aa6": "PumpfunSell",
"98d5df9de66578f5": "PumpFunSell",
"022494894536d3ee": "PumpFunSellOptions",
"3b844a157f460bc5": "PumpProgramInvocationFailed",
"24af7d411b0354d9": "PumpupConfiguration",
"21cb01fce7e40843": "Purchase",
"6a854973270e83fa": "PurchaseQuantityMustGreaterThanZero",
"fb0512b2e1d8ebb1": "Push",
"970d9278c3427f37": "PushPriceParam",
"b0b0231590fb7526": "Pyth",
"7dcf835dd00b6a73": "Pyth1K",
"3dc5feb71ff67644": "Pyth1KPull",
"3826cfabc56f2780": "Pyth1M",
"1b72ddb71c84d576": "Pyth1MPull",
"c6e56cfecc442554": "PythConfidence",
"afab5029516bce30": "PythConfiguration",
"13e31d819a6ef5b1": "PythEMA",
"14be10338cc3a2b6": "PythLazer",
"00bb4a3de12c3b75": "PythLazer1K",
"d0daf5a247ac4b77": "PythLazer1M",
"7fde89db17d6dc03": "PythLazerBestAskPriceNotPresent",
"e5464c0cb5e0e8cd": "PythLazerBestBidPriceNotPresent",
"c6dd864276605de6": "PythLazerData",
"4d742ea7586fc657": "PythLazerInvalidAskBidPrices",
"6a8c193a739c5af0": "PythLazerInvalidChannel",
"a994cf02d6f74e9e": "PythLazerInvalidConfidenceFactor",
"8c0260496f5b98e6": "PythLazerInvalidExponent",
"dbe194bc9d0da436": "PythLazerInvalidFeedId",
"316de61ddaf6d25e": "PythLazerInvalidFeedID",
"3e582d660fc742a2": "PythLazerInvalidFeedsLength",
"b3d5d06f67214c32": "PythLazerInvalidMessagePayload",
"9f07a1f922517985": "PythLazerOracle",
"5d3193f30585ded8": "PythLazerPriceNotPresent",
"168ce7956b0dbe9a": "PythLazerStableCoin",
"c7df061690abcba0": "PythLazerVerifyIxFailed",
"ffd86384818d5ab5": "PythLegacy",
"4400e7858af622fe": "PythPriceExponentTooLargeIncurringPrecisionLoss",
"5fceadff59f37f74": "PythPriceFeedStale",
"e2e5024df939ffea": "PythPriceNotFound",
"71682d81517ee79b": "PythPull",
"86cc30e21006b99c": "PythPullEMA",
"fb493b1a6d0598cd": "PythPullRedemption",
"67d2741345ccf42b": "PythPushFeedIdMustBe32Bytes",
"9abdf687a086c14a": "PythPushFeedIdNonHexCharacter",
"455fc92d997a5f95": "PythPushInvalidAccount",
"1bc9ee007a189be2": "PythPushInvalidWindowSize",
"ac5271293a37d4de": "PythPushOracle",
"a4ab7060ffe33df6": "PythPushStalePrice",
"14ca1938ef1414b2": "PythPushWrongAccountOwner",
"0ee3d3958f133775": "PythStableCoin",
"27d28d920b65a476": "PythStableCoinPull",
"ed3888648f425067": "PythStatus",
"193264d6a6d7df08": "PythValidSlot",
"ee042b5a88509a54": "Q64_64",
"2a8fc3b937da8566": "QualiaSwap",
"f3f836b6f055094d": "Quarry",
"23a232db10032546": "Queen",
"3779890d75d4274f": "QueryResult",
"a4c86c3e573f7b41": "QueueAccount",
"d9c2377fb8538a01": "QueueAccountData",
"26d459f83670c253": "Queued",
"d2d3a6a4447e4376": "QueueFull",
"1ff8774d79abd309": "QueueIndex",
"d1a2276b4d0aa4bb": "QueueIsEmpty",
"25dca4176fb87adc": "QueueMetadata",
"1756d6a864e3af3f": "QueueProxyVoteArgsV0",
"28b7911871580d76": "QueueResolveProposalArgsV0",
"6b29d08850ab8877": "QueueTaskArgsV0",
"8bb34180420d843b": "QueueType",
"3fe5b380c2ed7c39": "QueueWalletClaimArgsV0",
"971dc56ce9935ce7": "Quorum",
"a7ca14c6e44269d0": "Quote",
"dc20c80e0eeb985c": "QuoteAsset",
"503b9e69ca551391": "QuoteData",
"cc7d808888556b15": "QuoteOFTResult",
"6eb3c9809001f37e": "RadioInfoV0",
"8f853fad8a0a8ec8": "Raffle",
"85ac69d1eaed76e8": "RaffleNotFound",
"f2f6c43de1d39071": "RaffleRequiresLimit",
"bee09ba5735ef677": "RaffleTicket",
"22ee6784d1ffc3eb": "RaffleTicketEmpty",
"50065945ad3a1cd7": "RaffleTicketNotWinner",
"1cf4b31a25dc9599": "RampMessageHeader",
"43562a998892b383": "RandomData",
"bc60d8f85d5e3170": "Randomness",
"0a42e587dcefd972": "RandomnessAccountData",
"b79b3e0364f30196": "RandomnessNotRequested",
"5f73e65cdd2555ac": "RandomnessNotResolved",
"f4e7e4a0941c11b8": "RandomnessRequest",
"a9d0329a616a8607": "RandomnessResult",
"874bb2a7e29cb27a": "RandomNumbersGenerated",
"6d260690960a841f": "Range",
"1ae76dd61e846178": "RangeTooWide",
"df88afdfd022d6ee": "RateLimiter",
"bfa604efe6366e3d": "RateLimitExceeded",
"4bad56cf34aa4761": "RateLimitState",
"36e59f9e961f250e": "RatesFull",
"ac0ccf0043002a87": "RATIO",
"b03dea0b17190138": "RatioFees",
"3ff28814d0d299b2": "RatioOutOfBounds",
"9bdab8f5afbfaed7": "RAY",
"22b381ab98193f2c": "RAY_EMA",
"fa2fd605bbdcd78f": "Raydium",
"a1d589834fd4fca5": "RaydiumAmmSwap",
"ec4cae50abb5c406": "RaydiumAmmSwapOptions",
"3d4703a6d6a7b7d6": "RaydiumAmmV3AtoB",
"1206dcf5cbc6415b": "RaydiumAmmV3BtoA",
"2c143c1bc9ab6fdf": "RaydiumAmmV4",
"14ff06f290e078fd": "RaydiumClmm",
"a69eed0a389a1f9f": "RaydiumCLMM",
"915f7acb62062cb9": "RaydiumClmmSwap",
"011602b61057e5f5": "RaydiumClmmSwapOptions",
"68880440d929eb30": "RaydiumClmmSwapV2",
"293a3be37f9adecc": "RaydiumClmmSwapV2Options",
"a8be2c08b3b37623": "RaydiumClmmV2",
"b0a2cda6d61f917f": "RaydiumCP",
"ceec1ccdd1225e10": "RaydiumCpmm",
"fc4beefa4f84c0d9": "RaydiumCpmmSwap",
"8bfcfa10acd6c5a1": "RaydiumCpSwap",
"8ca77a3af782bad8": "RaydiumCpSwapOptions",
"9422a83c27c2fbc6": "RaydiumInvaildTickIndex",
"89dbe444660d73c2": "RaydiumInvalidFirstTickArrayAccount",
"ba69083b62ac06b0": "RaydiumInvalidTickArray",
"7dcbba5b96560bff": "RaydiumLaunchlabBuy",
"24784522a858735a": "RaydiumLaunchlabSell",
"242cfdcbd87ea62f": "RaydiumLaunchpad",
"ef2d013af0267328": "RaydiumNotEnoughTickArrayAccount",
"f111f67ecab15d94": "RaydiumStable",
"b27552be373b0e2f": "RaydiumStableSwap",
"1809c8e884ec1f8d": "RaydiumSwap",
"1792dc313a0d2cc6": "RaydiumZeroAmountSpecified",
"add8b589192f7015": "ReachedMaxSequenceNumber",
"e2538921018e7d23": "ReadOnly",
"836c0842861b0621": "ReadOnlyAccount",
"9c1ac4e5b2e511bc": "Ready",
"48021bfe8be25a38": "ReadyForPublishing",
"9b468bb011afefdc": "ReadyForSettlement",
"585c0c92977430f4": "ReadyToClose",
"2f5ff913e876fded": "ReadyToUndelegate",
"cd516e6a0eebed17": "ReadyToVoid",
"27bd83d5063f31ea": "RealTime",
"e449e4e3aad057c6": "Rebalance",
"e9520fa08a4c154c": "RebalanceAction",
"6da51ff387c1db05": "RebalanceAutodriftState",
"fc552a98325c94b6": "RebalanceAutodriftStep",
"529dce6988123d6c": "RebalanceAutodriftWindow",
"ab239ad7ba85e30f": "RebalanceBurn",
"7024d03b33cd1044": "RebalanceConditionsNotMet",
"9baef01d8c0233e7": "RebalanceDisabled",
"7e379514821c633b": "RebalanceDriftState",
"c1537b28b753bb94": "RebalanceDriftStep",
"91a8e02932350e4a": "RebalanceEffects",
"7fe1e209ba7ce6ae": "RebalanceExpanderState",
"dfd2563c1a6dbe89": "RebalanceManualState",
"600f90a683325ee4": "RebalanceMint",
"7f789a96be768866": "RebalancePricePercentageState",
"66be040f29e7ed52": "RebalancePricePercentageWithResetState",
"5a2d23af9bbb6077": "RebalanceRaw",
"8cb8252be2413ce0": "RebalancesCapReached",
"b5df54e1b49d48d2": "RebalanceState",
"4283378db745650a": "RebalanceTakeProfitState",
"92c7ce43de02ae8a": "RebalanceTakeProfitStep",
"da6ec8bbf1ea00a2": "RebalanceTakeProfitToken",
"770a377830e63aa0": "RebalanceType",
"d56387f8736a2bd7": "RebalanceTypeTag",
"f590e4a4a433b546": "Rebalancing",
"c6783d60696061cc": "RebateFeeMaxExceeded",
"41677688a97a669e": "RebateFeeNotEnough",
"75d4bb287cfb55e5": "Receive",
"a29f99bc3841f53a": "ReceiveConfig",
"8ee2fb8a01ce5bc1": "ReceiveLibraryConfig",
"364a7ea382b26918": "ReceiveLibraryTimeout",
"f3dbafec9356640d": "ReceiveNftOnLiquidation",
"a929d63aa997b73c": "RECEIVER_SEED",
"933909ea015e6abc": "ReceiveUln",
"8cf821821e3b3207": "Recenter",
"07392c4b112f390c": "RecentProposal",
"0aa29c6438c1cd4d": "Recipe",
"c7998eec631a18ce": "RecipeCategory",
"dd6d842a3160c557": "RecipeCategoryCountNotZero",
"1d7135c2a033eb7b": "RecipeCountNotZero",
"e6e02cfdf8b0eaf5": "RecipeIngredients",
"cee8222ba631441d": "RecipeInputsOutputs",
"f092935b1e697ba4": "RecipeLimitExceeded",
"38622a862068a978": "RecipeStatus",
"ae0ec7d9ce6c9a32": "RecipientV0",
"0311eb5b6d55fee7": "ReclaimIndex",
"1887434634d094d7": "RecordedBalanceChanged",
"75ac71a67dcd2e04": "RecordedVestingBalanceChanged",
"d1a53afc7e3b4860": "RecoverWithStake",
"cdd5eeacf0585adf": "RedBlack",
"25699f8035c10311": "RedDwarf",
"9703aca29239f66e": "Redeem",
"1fa222ca2841cadb": "RedeemCrewPacksInput",
"cf2bcabcc0e745b6": "RedeemedAmount",
"66d59ef1be61d8db": "RedeemedDuringStage",
"d01e0ff10f4b8a5c": "RedelegateOverTarget",
"95d127cc678c32a9": "RedemptionClearingOrderIsIncorrect",
"ad01562f1bcc92b9": "RedemptionConfig",
"543fa1e63bb745d6": "RedemptionEpoch",
"456be6048df4a95a": "RedemptionFillerNotFound",
"d50bcc4caeff610d": "RedemptionGating",
"3bb65b1b4996d24e": "RedemptionIndexOutOfBounds",
"39a4ca72ae66d699": "RedemptionQueue",
"759dd6d640a01f3a": "RedemptionRequest",
"f9a88c5e03341358": "RedemptionRequestOutOfOrder",
"87b0104ce75c445a": "RedemptionsAmountTooSmall",
"e12a277a917615de": "RedemptionSharesTooLow",
"6ca3f1383fb50a4a": "RedemptionsQueueIsEmpty",
"2a451a153663d342": "RedemptionsQueueIsFull",
"d868853c93b800dc": "RedemptionUserNotFound",
"18487bf051d72331": "RedepositingMarinadeStake",
"4912660d649361c6": "RedGiant",
"07e3971c5e8f4b8e": "RedistributeAll",
"3e4e9da37a8db2dc": "RedStone",
"f2d139d5dfc87f9e": "Reduce",
"07203c782b7a1a2e": "ReduceOnly",
"e8fd92dcee92e5ad": "ReduceOnlyOrderIncreasedPosition",
"0862ca4ded39ea91": "ReduceOnlyOrderIncreasedRisk",
"96c32626f0212182": "ReduceOnlyWithdrawIncreasedRisk",
"ce6d6bb952901109": "RedundantOwnerProposal",
"05cc32904d885742": "Refer",
"6305d8d4fa4b4a0c": "ReferenceAddresses",
"e42d4c1a805236f9": "ReferenceAddressesSet",
"4e037be531cb6d2c": "ReferencePriceType",
"1eeb88e06a6b3140": "Referral",
"eda2504ec4e95b02": "ReferralAccount",
"99451ee78255ea4b": "ReferralAuthoritySet",
"99e208772ef876c1": "ReferralCodeHasBeenSet",
"2e9fce1254303c00": "ReferralCodeV2",
"f697b81da15ed20c": "ReferrerAccountMintMissmatch",
"9780a6da7b6af6fd": "ReferrerAccountMissing",
"fc5ce0266bbe39f7": "ReferrerAccountNotInitialized",
"35f8f9d909169d9e": "ReferrerAccountReferrerMissmatch",
"0e50fd91803cfc90": "ReferrerAccountWrongAddress",
"cb17ddd21e4ef78b": "ReferrerAndReferrerStatsAuthorityUnequal",
"4f4173ca5b9ee925": "ReferrerFeeRateTooHigh",
"606ed59bb3e750fe": "ReferrerHasBeenSet",
"04677895b5f66568": "ReferrerMustBeWritable",
"6985aa6e342a1cb6": "ReferrerName",
"7e53d3b0eaae325a": "ReferrerNotFound",
"c251d9670c130c42": "ReferrerState",
"bca8798c1d2dc077": "ReferrerStatsMustBeWritable",
"d7e957c32bca2c85": "ReferrerStatsNotFound",
"dc766e5714c73425": "ReferrerStatus",
"270fd04d20c36938": "ReferrerTokenState",
"56f0ba9355a04ff8": "ReferrerType",
"cd99a036ef1adbbc": "ReflectionAccount",
"12be135c6fee81ee": "RefreshCannotShorten",
"bec36f7783967b0a": "RefreshInCPI",
"5b6003cad8900d1e": "RefreshNotNeeded",
"1c762d774dfd5f4c": "RefreshStakeLog",
"e0fd4c1aa56289af": "RefreshStakeUserLog",
"c2f572bfdc074e43": "REFUNDED",
"0ff2f0949a345e65": "Refund",
"86adf424a2265af9": "Register",
"767ca502086f503e": "RegisterCraftableItemInput",
"50cbf4ce4c6fe380": "RegisterCraftingFacilityInput",
"6386fe97fca5f21f": "REGISTERED",
"3c72f48610a63395": "RegisteredCurrency",
"a2acd4d2ee589a31": "RegisteredLocker",
"1ffbb4eb03743204": "RegisteredProgram",
"0bfbcb97b491272e": "RegisteredStake",
"e768b660a82bd814": "RegisteredTransceiver",
"39d57fe31817a371": "RegisterMineItemInput",
"e319b8645f130c92": "RegisterPackTiersInput",
"3d24d3accd9889de": "RegisterPackTypeInput",
"9fb224e32b0fe1d6": "RegisterPlanetInput",
"3e4b22e3152d8c85": "RegisterProgressionConfigInput",
"6a3ea96e48a3fc69": "RegisterRecipeCategoryInput",
"76e7414a8ca204ad": "RegisterRecipeInput",
"faca685976935e2c": "RegisterResourceInput",
"1a68b6f2d6aff0d3": "RegisterSagePointsModifierInput",
"49499395159609d3": "RegisterSftRedemptionInput",
"011c8224c8fc3d1b": "RegisterShipInput",
"fcf234421906051a": "RegisterStarbaseInput",
"057d5fbeab02c185": "RegisterStarbaseInputUnpacked",
"4928d8fd38b765c6": "RegisterStarInput",
"5a21a55e7df550e6": "RegisterSurveyDataUnitTrackerInput",
"c1cacd334ea89680": "Registrar",
"9e81e65a5d5f6537": "Registration",
"3ce1a4d2eb4ace82": "RegistrationNotFinalized",
"2fae6ef6b8b6fcda": "Registry",
"f91dac8b16f4e55b": "RegistryLocked",
"21cbd887c8d3122c": "Regular",
"843c0cc8ac996b5b": "Reimburse",
"02ac8a4c2bce284d": "Reinvest",
"8c20ad1d422ca39f": "ReinvestNotEnoughRewards",
"0f46777cd9a5c91b": "Reject",
"6825be4a3aa152f2": "Rejected",
"7aa2de5c253a8f77": "RejectTeamApplication",
"22c8b06dcfd8c505": "RelayerIsTraderFeeSubmit",
"e5316094a7bc1131": "Release",
"34a588fd23f76c07": "ReleaseAfter",
"d24df2b272780cbd": "ReleaseBumps",
"4c193ff3a74902fb": "ReleaseConfig",
"c8777a054b778df1": "Released",
"331c26a1c23b3aa8": "ReleaseExceedsExistingLockedAmount",
"357e27bb662adffe": "ReleaseMetadataData",
"111b5a72aedd4329": "ReleaseNotLive",
"5f21491f0da8cf18": "ReleaseOpenToLimitedEditionInvalidAmount",
"ea5d57c99ec625fb": "ReleasePurchaseWrongReceiver",
"de4bc6bbd1f03499": "ReleaseStatus",
"7184cffd957c792d": "RemainingAccountsDuplicatedAccountsType",
"c21f8f3f0c55d153": "RemainingAccountsInfo",
"15e5fb064277b508": "RemainingAccountsInvalidSlice",
"6b8ee53873f9d870": "RemainingAccountsInvalidSliceLength",
"62296c1b382c1a13": "RemainingAccountsSlice",
"f4e1ee74c70c09bf": "RemoteTaskTransactionV0",
"6973ae225fe98afc": "RemoteTokenMessenger",
"04dc897355e8af69": "RemoteTokenMessengerAdded",
"b591ecbced56c506": "RemoteTokenMessengerRemoved",
"f34bc46daca2e0ca": "RemoteV0",
"47e8f5ff75282429": "Remove",
"d257440a8588a9d6": "RemoveCollateral",
"abb4b21c8d646e10": "RemoveCollateralAndSwapLog",
"1cff5e45679423e0": "RemoveCollateralLog",
"fee3f68601e3601a": "RemoveCollateralLogV2",
"0bed335fbf87863a": "RemoveCollateralLogV3",
"2880961ca4d1577e": "RemoveCompoundingLiquidityLog",
"c08a8f2ccd66ebc1": "RemoveCraftingFacilityRecipeCategoryInput",
"2f39f7d298021fdc": "RemoveCrewInput",
"10542ff72a782c4d": "RemoveCronTransactionArgsV0",
"bdeecd152472c448": "RemoveCustody",
"3c98393baff0e8ff": "RemoveEntityFromCronArgsV0",
"a0763457ee9ae9d3": "RemoveLastMember",
"a163afeb1ab27824": "RemoveLiquidity",
"2f4c8814bb4b10de": "RemoveLiquidityData",
"56999e1799dd309c": "RemoveLiquidityDerisk",
"bcf1d55f8201fbfb": "RemoveLiquidityLog",
"d8a617fb449e30b2": "RemoveLiquidityLogV2",
"62fd59dfc12466c1": "RemoveLiquidityMode",
"c1b7f0046e6c91dc": "RemoveLiquidityParameters",
"f6457bb388590a2a": "RemoveManagerMustBeCaptain",
"cd22cf20d7ac2a3e": "RemoveMarket",
"cb776d04a1b8ccc3": "RemoveMember",
"facc9ee71e4bd3e4": "RemoveMemberFromTeam",
"b2b10443f2a0dcc8": "RemovePointCategoryLevelInput",
"2151d61fb47f70cd": "RemovePool",
"7b6e5fcd0d3101c6": "RemoveRecipeIngredientInput",
"46e22a88186e3c48": "RemoveRecipeIngredients",
"e4c5feaf718036a7": "RemoveRedemptionEpochInput",
"5bda994a77b60fc2": "RemoveShipEscrowInput",
"0f98e11e4c5685ba": "RemoveSpendingLimit",
"0c40d9fdd278cb77": "RemoveUserFromTopHolder",
"2144cd5cf04977fd": "RemovingValidatorWithBalance",
"88de7880486e2af1": "RenameFlp",
"54cecc92f0da130e": "RentalAgreement",
"6836fa037a8e8c57": "RentalIsActive",
"bec06e526e896f40": "RentalNotOpen",
"61a21ddefbfbb4f4": "RentalState",
"da79ae129b8027aa": "RentedFleet",
"594d8be2ef6e15b8": "RentNotDue",
"eec271cae3b982cd": "RentOverdue",
"6725b24aef303b39": "RentReclamationDisabled",
"8def5cc16d0b9c89": "Repaid",
"31aaab29b2f9e0e7": "Repay",
"c16112f6f2405c4a": "RepayBorrow",
"36773b5d1c9ae095": "RepaymentExceedsTotalOutstanding",
"cc75181cb9098762": "RepayOnly",
"9c52d033b55b7d4e": "RepayTooSmall",
"738d8e4edb769e2b": "RepayTooSmallForFullLiquidation",
"755ae6ba5f697fb2": "RepeatedMint",
"a261d575e85d9181": "ReportLoss",
"19e7581c8c5c69a7": "ReportVerified",
"ffa6564e9d9f980f": "ReportWork",
"ea6f36c9257bed73": "RequestChange",
"ab64f6208a57efd5": "RequestEarlyUnstake",
"f6c78c75c935a281": "RequestRemove",
"0cd71cad10be02a4": "RequestType",
"0255f603f8027d05": "RequestUpdatedTooRecent",
"cb51df8daf6c6572": "RequestWithdrawVaultReceipt",
"65d22f953d907d61": "RequeueCronTaskArgsV0",
"2acba35a701b193c": "RequeueWalletClaimArgsV0",
"f9a0742c4c3414d5": "RequirementType",
"2bf2ccca1af73b7f": "Reserve",
"8730272e2a1c25b1": "ReserveCollateral",
"53f1fac8745fb246": "ReserveConfig",
"ccf60dcf70f47c4b": "ReserveDeprecated",
"2b93355e2988a5c6": "ReservedOrder",
"d9c7843dd597c30f": "ReservedSpots",
"17778c2492dd6ed2": "ReserveFarmKind",
"a8c801eb53d27211": "ReserveFees",
"3482a6ab92270333": "ReserveHasNonZeroAllocationOrCTokens",
"34dcd59497fe2b79": "ReserveIsStale",
"d0628a179e39c178": "ReserveLessThanFee",
"e8f0c9f6d74c533c": "ReserveLiquidity",
"92185d09164bee10": "ReserveMaxExceeded",
"ace86e737bd6c604": "ReserveNotEnough",
"1bffe73eef151418": "ReserveNotPartOfAllocations",
"332e09ae28cd04da": "ReserveNotProvidedInTheAccounts",
"330f17fb351f0848": "ReserveObsolete",
"545c7227de477e84": "ReserveSpaceExhausted",
"155212e5e225bb6c": "ReserveStale",
"c814b6d655837fbd": "ReserveStatus",
"a4cb755402da7473": "ResetAccumulator",
"27a2cc9dbe932284": "ResetAllowedBroker",
"46816444968210ed": "ResetAllowedToken",
"c5f28380bf427652": "ResetLockupArgsV0",
"6e9b9b079e7448c2": "ResetReferencePrices",
"b17b2922a42adda5": "ResolutionNode",
"a9263345be760a82": "ResolutionSettingsV0",
"e8a3d84ee8f2fa91": "ResolutionStrategy",
"2e7093d816690431": "Resolved",
"20024af8ae6c469c": "ResolverAccess",
"0aa002012acf33d4": "Resource",
"e8575f608006ba0a": "ResourceAmountTooSmall",
"ce60c756541a2076": "Respawn",
"1855bcd403bfb925": "RespawnNotPossible",
"81d7e144d7f18cc5": "RespawnTimeNotElapsed",
"a8006ae01d8d49da": "RespawnToLoadingBayInput",
"ba479ece66d21cd2": "ResponseTiming",
"59d84da79a98c562": "RestakeVST",
"cb656b1b63096895": "RestakeVSTCommand",
"da97b7c351bb5cf2": "RestakeVSTCommandItem",
"7001b1f1b0af375c": "RestakeVSTCommandResult",
"f07ae0cb1af8cde8": "RestakeVSTCommandState",
"cf908e43e4b8fdbd": "RestakingVault",
"af2fed9698ff9aef": "RestakingVaultDelegation",
"05fc02fd9a6e06c3": "ResultMustBeGreaterThanZero",
"b3ee77333eff3ac2": "ResultNotRequested",
"39f2d56f9846bd76": "ResultRequested",
"0ba12a68053001f3": "ReturnTasksArgsV0",
"c50f3949ca6a025c": "ReusingDelayedUnstakeTicket",
"7cd4a4ad02427dd1": "RevealDrawLotteryResult",
"74a2aa8ef9aaf7b2": "RevenueSettingsCannotSettleToIF",
"771fae9bf6161c7e": "RevertFill",
"aece05fc99bc89fc": "RevertibleBuffer",
"3fc80b2c48acf74b": "Revoked",
"b353ed31d75e5fa5": "RevokeManagerPrivileges",
"07041a91d3e8e6a3": "RevokeProgramArgsV0",
"82064530c42b5264": "Revshare",
"2fcb8b13184d2cc1": "RevshareMiner",
"ae812ad4be122d22": "Reward",
"4f852e4f9ada63c7": "REWARD_ACCOUNT_CURRENT_VERSION",
"b99a82e909a1960d": "RewardableEntityConfigV0",
"e1511ffd54eaab81": "RewardAccount",
"404281afcf37f328": "RewardAtaOwnerNotAdmin",
"485e9cea90b83dfb": "RewardAtaOwnerNotPayer",
"ac66dabb500f4e4a": "RewardAtaRewardMintMissmatch",
"91bbf8c50b5a038d": "RewardCampaignInProgress",
"d0bfad0ed554b3a2": "RewardEntry",
"5303cbaef41eacc6": "Rewarder",
"60fb4eb32515febb": "RewarderUpdatedData",
"23f218637c43e2a0": "RewardExceededMaxTokenAllocatedAmountRecordException",
"f8c9547bef007355": "RewardIndexOutOfRange",
"27078116f1605385": "RewardInfo",
"4e5f531030fd5563": "RewardInitialized",
"0fa8682403eb63e8": "RewardInvalidAccountingException",
"c0c88eed90fb6e1f": "RewardInvalidAllocatedAmountDeltaException",
"8b2661b4ff18ca3c": "RewardInvalidPoolAccessException",
"98246850593db535": "RewardInvalidPoolConfigurationException",
"bcfec25741e5bb2e": "RewardInvalidSettlementBlockContributionException",
"c71fdb0f3a4a4471": "RewardInvalidSettlementBlockHeightException",
"7b337b718d99e698": "RewardInvalidTotalUserSettledAmountException",
"15be8654603de875": "RewardInvalidTotalUserSettledContributionException",
"219da15e35c524ac": "RewardInvalidTransferArgsException",
"1ef6244e035e4c63": "RewardNotEnded",
"acfe10065253dffe": "RewardNotInitialized",
"4cfaeb6079c876b3": "RewardNotStrategyToken",
"1f16240a3699bc64": "RewardPerTimeUnitPoint",
"8679c5d3859a5220": "RewardPool",
"3ddd2c1a60b4a6ff": "RewardPoolDrained",
"614ef994a625e797": "RewardPoolEmpty",
"8b299c431ff274e8": "RewardPoolIndexOccupied",
"877d874ddc2a2510": "RewardRateValuesInput",
"4b8358317a39d376": "RewardRateValuesInputUnpacked",
"d21a58215e70972c": "RewardReceived",
"0cdf44653f212665": "Rewards",
"5fcb68413cf273c2": "RewardScheduleCurve",
"8f215e07b4e076d4": "RewardScheduleCurveSet",
"9d01e97fe169ea99": "RewardSettlement",
"9781edcab0e56e12": "RewardSettlementBlock",
"c198dc66c19dcb60": "RewardsExceedingSupply",
"06255516207ba8d4": "RewardsFeeIsTooHigh",
"cf69640015366723": "RewardsNotReady",
"19488e316d5679c9": "RewardsPerAmountUpdatedData",
"4ee952b33ea7aa3d": "RewardsPerWeightUpdatedData",
"d3b649d514c87ce0": "RewardsTreasuryVaultHasCloseAuthority",
"b1481998d2b1005a": "RewardsTreasuryVaultHasDelegate",
"7d04ce0ab69d0bb9": "RewardsVaultHasCloseAuthority",
"f40cd1eb7b4b0358": "RewardsVaultHasDelegate",
"ea5df92d45b9661c": "RewardToken",
"7aebddb5a2f2a6fa": "RewardType",
"78bedda5099ae045": "RewardUninitialized",
"d953c2b3b22a84f6": "RFQOrderNotFilled",
"bbd1a92f7267ab90": "RFQUserAccountFull",
"4debeeef8f739537": "RFQUserAccountWrongMutability",
"a42108d2c2de4440": "RiskEngineInitRejected",
"3ade8eeee819a146": "RiskingIncreasingOrder",
"e4ecae169fd0a192": "RiskLimitExceeded",
"1636813b789258f6": "RiskRequirementType",
"73fa0ab028b962b9": "RiskTier",
"9a012c9291e8a2ac": "RiskZoneData",
"1aff8659b232b38f": "RiskZoneDataUnpacked",
"688629160a4990ca": "RiskZonesData",
"986b5078a16e4859": "RiskZonesDataUnpacked",
"2edbc518e9f9fd9a": "Role",
"9369a034601706b2": "RoleHasMembers",
"2594a475c0ed1042": "RoleLimitExceeded",
"0f2b3613d9905fca": "RoleMap",
"0b200f3ab80173a0": "RoleMapEntry",
"55ee9307b354c26d": "RoleMembership",
"ec6d182b818f5e40": "RoleMetadata",
"d5f9dfdc5c1402d7": "RoleNotAcceptingMembers",
"a52dbbfb476ecc58": "RoleNotFound",
"8af0d06179a9cd88": "RoleStore",
"7361cddc3dd8226d": "RolloverMetadata",
"0f39d55735ed4e64": "RolloverNotConfigured",
"2e9f8325f5540509": "Root",
"fdd1dc6bcebf479e": "RootEscrow",
"562f1f9c21beae13": "RootNotCommitted",
"b2c026ff5c4def59": "Roulette",
"fe08e59b8f30fc6b": "RouletteSelection",
"577fa533494e74ae": "Round",
"d2e792f5a75524e3": "RoundCreated",
"c4a156fe8abb9b3f": "RoundCreatedData",
"6347584f4c5c742a": "RoundData",
"fff0e2a3a3752ddf": "RoundDirection",
"2d65f9595c750887": "RoundDown",
"e32c421235f8a20d": "RoundEnd",
"aaa8cfb0b903f007": "Rounding",
"b067085d8a9219ae": "RoundingDirection",
"e547ef4cfe1f85ab": "RoundingMode",
"951816a44634302d": "RoundInProgress",
"8ef98bce62d25bfb": "RoundNotStarted",
"855ce6985f717fb9": "RoundRequested",
"c0ac33fa86ecb387": "RoundUp",
"ee0e9306313355f2": "RoundUpdated",
"07ca370f9295515c": "RoundUpdatedData",
"558c24463fc0b3d5": "RoundWagered",
"349c6058429bb2b6": "RoundWageredData",
"50b33a7334139286": "Route",
"d305071b896d7f05": "RouteInputUnderconsumption",
"d62b1bc70509d7c5": "RoutePlan",
"5ee3b6c2b22d7f33": "RoutePlanStep",
"1063ca0738cd2077": "Royalties",
"5d0b5c22d7d0499a": "RoyaltiesEnabled",
"8fc0624ae128e62a": "RoyaltyBasisPointsInvalid",
"f788b3f1cc80adf3": "RoyaltyCannotExceedOneHundredPercent",
"763e7ef98b426b36": "RoyaltyExceeds100Percent",
"ddbdd365f247993b": "RoyaltyPercentageIncorrect",
"9afd560c29e07d73": "RoyaltyRecipient",
"6ee71f6644c5d7bd": "RoyaltyTier",
"4a0aca62682e5e32": "RoyaltyTierLength",
"3d3a01af0b4e7241": "RoyaltyTransferTooLarge",
"0aecb31d401d78e3": "RpsDecimals",
"bb93ebba9077f238": "RubiconSwap",
"e79da44abbd65749": "RubiconSwapOptions",
"3e82713b7743dc2c": "Ruffle",
"d3981f6c559f542a": "RuffleAuthoritySet",
"fc219e6f832bc07a": "RuffleTicket",
"520a3528fa3d8f82": "Rule",
"3942cc806a97aaf3": "RuleSet",
"c2a96ee6eb0be116": "RunAccount",
"3ad4e57f5a82cb15": "RunTaskArgsV0",
"6bbf0592159cf6fe": "RunTaskReturnV0",
"ab4c804dfca98556": "RveSonicConfigAccount",
"c268ad82927b2e0a": "RveTokenConfigAccount",
"921ad8dc480d410e": "RveTokenDisable",
"e544660f85dfdbfd": "Saber",
"d18e98c18bfa8809": "SaberAddDecimalsDeposit",
"6510f040102e5496": "SaberAddDecimalsWithdraw",
"2a4e2fdadaef8be4": "SaberMSOL_SOL",
"cef39f6ef3a93bcf": "SafeTriggerOrder",
"cd93e5b49bc30662": "Saga",
"f72a186da103f8a6": "SageCrewConfig",
"0a374bea7e0e2f92": "SagePlayerProfile",
"cf1159ce0df51a4c": "SagePointsCategory",
"a4bea07a920389dc": "SaleEnded",
"a32e9fbc1494c15f": "SaleLive",
"77e905af87232439": "SaleRequiresSigner",
"068ac0374619fee2": "SameAdmin",
"1bbb77b103612b50": "SameAdminAccount",
"35f5e4019afcb825": "SameAdminCandidatePubkey",
"471e9bc539af68dd": "SameAdminPubkey",
"152073c46975d1ac": "SameAdmins",
"012f682816b44515": "SameAssetAndLiabilityBanks",
"6e417ed7b05be909": "SameClawbackReceiver",
"3753e470ba41c53d": "SameOperator",
"96145dbeb6dcbeb8": "SameOutputTokensNotMerged",
"b15fbf564812159d": "SameTokenMints",
"b33978288bc9d651": "SameValue",
"4f22a462120151a3": "SAMO",
"ec341c60046f7692": "SAMO_TWAP",
"d45b8cb52539d59c": "SanctumAddLiq",
"4d0626052888479d": "SanctumMultiValidatorSPLStakePool",
"a9f121180a1e8340": "SanctumNonWsolSwap",
"f04a2fa96d8c2819": "SanctumRemoveLiq",
"8b99dc51c09f5b75": "SanctumRouter",
"fd27a28f70097a33": "SanctumS",
"8eeac8bde0945ed7": "SanctumSAddLiquidity",
"dd8e9b946f028c51": "SanctumSingleValidatorSPLStakePool",
"b15ce7a24e75c402": "SanctumSRemoveLiquidity",
"15828618b0ead083": "SanctumWsolSwap",
"5588124f12fef075": "Saros",
"560280ef54dcb8b6": "Sbt",
"f8ce05f6dbd08dcf": "ScaleExceedsMaximumPrecision",
"0e07541733cd5418": "ScalesNotEqual",
"e767ee19d3968bad": "ScanForSurveyDataUnitsInput",
"ffc7b1181941e469": "ScanIsOnCooldown",
"cd2a782753318332": "ScanSuccessful",
"80a4104565dc5358": "ScanUnsuccessful",
"103fb735157db772": "SCNSOL",
"a539efd81ea0db5c": "Scope",
"b4338af7f0ad774f": "ScopeChainAccount",
"127bd9c842a5bb58": "ScopeChainUpdateFailed",
"c2a606b95008e355": "ScopeConfiguration",
"6ee4121b5931e933": "ScopeConversionChain",
"9422cb89dba1e91a": "ScopeOracleMaxAge",
"56be806755657d1f": "ScopeOraclePriceId",
"1a2e21f175d42720": "ScopeOraclePriceTooOld",
"13685e9f5c6e0342": "ScopePriceId",
"6fcf951156c3c6e4": "ScopePriceIdTest",
"5bcb92107523cff1": "ScopePrices",
"4a0d3c22d2a983fe": "ScopePricesAccount",
"2a768605ac64af7b": "ScopeProgramId",
"d75c1b14d9f346bd": "ScopeTwap",
"aed5266190aec350": "ScopeType",
"e1f25554e39553d0": "ScoreComponents",
"a026796dd5993674": "ScoreComponentsV2",
"b049f2e01eb35198": "ScoreDetails",
"2d52b64ba551793c": "ScoreVars",
"e41b553941433330": "ScorevarsAuthInvalid",
"d9647ae4dddbe52a": "ScorevarsNotInitialized",
"1bda89996a86da8f": "ScoreVarsShip",
"ccb6ac774fe3685a": "ScoringNotComplete",
"f0863a74bd97cf97": "Searcher",
"f0c9c32075a50eb7": "SeasonV0",
"65a9150ffb97ac78": "SecondaryTickArrayLower",
"e7f79d8caf55cb79": "SecondaryTickArrayUpper",
"74d4197350a968ac": "Seconds",
"e0f509e8b496cdcc": "Secp256k1Pubkey",
"b28e99c4e1071612": "SecpRecoverFailure",
"417517525085f7e9": "Sector",
"15ee04718a90d6fa": "SectorConnection",
"239f2d98ec027fb5": "SectorRing",
"a3d93f486d4b00d0": "Securitize",
"f549f5f0f8742ba5": "SEED",
"cd19d8d9a4efff6e": "SEED_SA",
"efc9f94c4c7040bc": "Seeds",
"d76bd4121cea94ad": "SeedsVecLocal",
"473ac0c0a06279e0": "SelectedStakeAccountHasNotEnoughFunds",
"b4a11bc2289277d2": "SelfReferral",
"20bd3fbfc281cbb3": "SelfTradeBehavior",
"f5a1d0810abe8a3f": "Sell",
"d15a2842d8ce2db7": "SELL",
"194cd71f65184b88": "SellerATACannotHaveDelegate",
"76ad4b13ade8d5d3": "SellerCannotBeAuthority",
"07e39c8deecf8b90": "SellerFeeBasisPointsOutOfRange",
"584c62b0e49a22a4": "SellerHistory",
"b27288d1aea6a8a0": "SellerTooManyItems",
"01ee48898a15fef9": "SellerTradeState",
"a40e5c647b39eacc": "SellerTradeStateV2",
"b7c3c3b48b70ffc1": "SellState",
"8eb5ac3950344ac5": "Sencha",
"2151b8faa2fc2555": "Send",
"b3e0ecd6527e7b03": "SendAndReceive",
"5bdd878983c7ae19": "SendConfig",
"580e906660eb1b45": "SenderNotPermitted",
"3dee1f48fb7542b0": "SendLibraryConfig",
"0750194266da78c4": "SendUln",
"78df52e7e45dd34e": "SequenceAccount",
"271e70e5389913f7": "SequenceOutOfOrder",
"7c1e9be309ed96a3": "SerializableAccount",
"4342e5cf5721bed7": "SerializableInstruction",
"d5a1f5b8e001fa20": "Serum",
"4d3177793d0820e3": "SerumV3",
"41a0c570efa867b9": "SerumV3FulfillmentConfig",
"4a8ba5e7c9b861f4": "SessionDurationBelowMinimumPermitted",
"f555645c8a6870a5": "Set",
"9dbcac3c183c8878": "SetAdmin",
"457f552f4b333636": "SetAdminSigners",
"6c026bdb3e7c034c": "SetAllowedBroker",
"3c961769abdb2e88": "SetAllowedToken",
"15e053a59ce3e616": "SetBilling",
"d9f1ef32f9d6ef1c": "SetBlacklistAuthority",
"c095031649540b4b": "SetBorrowRate",
"e4141f097bcc462d": "SetBurnLimitPerMessage",
"7982e1fabd582a2d": "SetConfig",
"e2841fb4a94fe163": "SetCurrentRewardsArgsV0",
"31d561bed315efca": "SetCurrentRewardsTransactionV0",
"c8b665a49bc7ba2c": "SetCurrentRewardsWrapperArgsV0",
"4682afbd418233cf": "SetCurrentRewardsWrapperArgsV1",
"ba725e5dd97e925d": "SetCustodyConfig",
"efbb8931f6dcb240": "SetCustomOraclePrice",
"f42e07ff3a578aeb": "SetDelegateLog",
"7fcd0fc04c16c375": "SetDestinationTo",
"0565db8117385ae8": "SetEntityActiveArgsV0",
"7734334f2466876e": "SetFeeData",
"1b39fa020a0c387e": "SetFeePayerData",
"cb64384e78678e2a": "SetFeeShare",
"0f1e0423f32e5714": "SetFlpStakeConfig",
"0ae8df941d165a3b": "SetInvTMaxData",
"850e705f9ccc40ac": "SetIsAutoReinvesting",
"69809dc54f8251c1": "SetMakerTreeArgsV0",
"6ed6f66021038a94": "SetMarketConfig",
"8acfb7e0f6d40ac2": "SetMathOp",
"64fc658d79856776": "SetMessageFee",
"05480cad4c1a6b32": "SetMetadataData",
"e7538bedeb9ad698": "SetOwnerData",
"b3102b358bc4ff64": "SetParameterAuthority",
"c652fc3f39f65657": "SetPendingGlobalAdmin",
"852c736496127a81": "SetPermissions",
"239d7fcc7d834d8c": "SetPerpetualsConfig",
"8c6a475c5c4060bf": "SetPoolConfig",
"130294632b27d331": "SetPoolFees",
"9da0f729444233c6": "SetRateData",
"a0211a9484b2eb0d": "SetReferrer",
"2f3212831c2539dd": "SetRentCollector",
"9875dedc1df3d2d1": "SetSourceTo",
"4d4d3aa1feba8f15": "SetStatusData",
"52bd6da7806d2815": "SetTestTime",
"deb5dc557d5a5fcf": "SetTimeLock",
"3f59cb9b4ced733a": "SettingsAccount",
"ce5e6c0c5cf60410": "Settled",
"a5ef276d30303f68": "SETTLED",
"c236920fef10cfbe": "SettledLose",
"180e0d40ad6f3811": "SettledTooEarly",
"3eac76a612e38772": "SettledWin",
"215e0e5203b302a6": "SettleFundsLog",
"dea4b6c2c7dba372": "SettleLiquidity",
"370bdb21248828b6": "Settlement",
"f22cdbc18c21bba9": "SETTLEMENT_CLAIM_SEED",
"ce156a863e3281aa": "SETTLEMENT_CLAIMS_ANCHOR_HEADER_SIZE",
"a5f40c47d3e219db": "SETTLEMENT_CLAIMS_SEED",
"e72e627f02c0170c": "SETTLEMENT_SEED",
"a2f59f4449cb5604": "SETTLEMENT_STAKER_AUTHORITY_SEED",
"d867e7f6ab637c85": "SettlementClaim",
"20823eafe736aa72": "SettlementClaims",
"d3e8a7e2ae1eb388": "SettlementClaimsNotInitialized",
"ad1d53bfe7d1b8f3": "SettlementClaimsTooManyRecords",
"e0a95c60762a7f90": "SettlementInvalidMarketOutcomeIndex",
"250b83f54fae6234": "SettlementMarketEscrowNonZero",
"f26a8739a1ed2021": "SettlementMarketFundingNonZero",
"a6687e6e6dd40b81": "SettlementMarketMatchingQueueNotEmpty",
"9b8c9461b5bd25f1": "SettlementMarketNotOpen",
"d8176dbb10710bb3": "SettlementMarketNotReadyForSettlement",
"94fc6dbff620b1d8": "SettlementMarketNotSettled",
"445c436c6e8500c3": "SettlementMarketPaymentsQueueNotEmpty",
"2d9adb52a23ec7c3": "SettlementNotClosed",
"08ab11d08df06484": "SettlementNotReadyForClaiming",
"88ddd9770c23d9f0": "SettlementPaymentCalculation",
"0e3916b714f88a59": "SettlementPaymentDequeueEmptyQueue",
"7711f51b966540c4": "SettlementPaymentQueueFull",
"d8e89a7267d9552e": "SettlePnl",
"5251130ee9b7e2bb": "SettlePnlExplanation",
"b2f1ddf37dd51abb": "SettlePnlMode",
"76d85d3596e98801": "SettlePnlPaused",
"6429970470dfd3cb": "SettlePnlRecord",
"d949a2f6a189347a": "SettlePnlWithPosition",
"20e8d2656352dc49": "SettlePreviousRound",
"7b999556bdc8bf0e": "Settling",
"384415f34ec2bdaf": "SetTokenController",
"643df31e7e8117a7": "SetTokenReward",
"fae91009ae06c9ad": "SetTokenRewardLog",
"8af9f61151c748f8": "SetTokenStakeLevel",
"967c992e91356951": "SetTokenVaultConfig",
"745ef97c1d556e01": "SetTreasuryFeeBps",
"28e86ade0f3a3dbd": "SetTriggerPriceLog",
"d689cd8463927161": "SetTriggerPriceLogV2",
"e11e647b36038666": "SetWhilelistedAddrData",
"3a0526283f5fcfba": "Seven",
"3a5a5431a80ec3be": "SftRedemption",
"d3c00beabc9bfa65": "SHADOW",
"d40e5b55fea81fab": "ShadowStormPrice",
"70e293069cd2d6a6": "Shared",
"ed390555429e0c1a": "Shares",
"334150fe8a6f61ee": "SharesMintDecimalsIncorrect",
"5e1d7dc73064cb64": "SharesMintIncorrect",
"e44c692fa0161663": "SharesNotZero",
"bac46e1f2ddcc2dc": "SharesPercent",
"ee53a7646501c302": "SharesPercentTooLarge",
"541699eb47427fdf": "SharesZero",
"102b275afdad380d": "Shift",
"cc0ab0d04041d02c": "ShiftBy",
"2ae90fd309fd779c": "ShiftRemoved",
"7a38f8e973425e59": "ShiftTokenAccounts",
"7229f5e8183aea9e": "Ship",
"c5ad55d6546b5b2b": "ShipCounts",
"cf72a77f275def85": "ShipCountsUnpacked",
"b4c9edd54be3dfcc": "ShipNotExpected",
"d91d4118de0716b6": "ShipSizes",
"43e55428bc25097b": "ShipStaking",
"6c412326735d7023": "ShipStats",
"54aa263f24a4d624": "ShipStatsUnpacked",
"71d32a570842a6e0": "Short",
"1c59ae19e27c7ed4": "ShortUrl",
"342f22199e409656": "ShortUrlNotAsciiAlphanumeric",
"a20ba3cb877c7673": "ShouldBeActive",
"af360d305fefe166": "ShouldBeTheFirstIxInATx",
"c0d98a3e50dd8291": "ShrinkingListWithDeletingContents",
"9805723c1dd62fb7": "Side",
"372dd24b734985a7": "SideAndOrderTree",
"7a14358afd8a0339": "SignatureIsToLong",
"b7bd0d9266825ed6": "SignatureThresholdTooLow",
"fa079ff4af402d8c": "SignatureThresholdUpdated",
"d68168acc5982aa4": "Signed",
"d797003898ed8fcb": "SignedMessage",
"ad1a7a1e4961b321": "SignedMsgOrderId",
"968bf45f1c0f05c7": "SignedMsgOrderParamsDelegateMessage",
"4b737ce3975f9f71": "SignedMsgOrderParamsMessage",
"cbe04e6e04ad15b7": "SignedMsgOrderRecord",
"ddaa472bc1243646": "SignedMsgUserAccountWrongMutability",
"460632f8de018f31": "SignedMsgUserOrders",
"24feeee558b5c45b": "SignedMsgUserOrdersAccountFull",
"197fddaf5958dd75": "SignedMsgUserOrdersFixed",
"be736f2cd8fc6c55": "SignedMsgWsDelegates",
"3a49c83e9400fae7": "SignedTransferRequest",
"3ea7eaab9cf65251": "SignerCheckFailed",
"0c37ea83dfe6c27f": "SignerNotInCommittee",
"fcc9d2341cfe3363": "Signers",
"0d0331d9118e26ef": "SigningKey",
"f37edc47c9f3c879": "SigningKeys",
"a93497c9b819a25b": "SignOffProposal",
"82a4f6716ea86993": "SigVerificationFailed",
"b2963cf8a9a13445": "SimulationPrice",
"179a001a49e33146": "Single",
"b2d41ec8d0d04241": "SINGLE_LISTING_SIZE",
"0e72d48c18861f18": "SingleListing",
"4e0da9bd748a0bf3": "Six",
"90b0d6dfa2756225": "SizeClass",
"a9710167d0b799bf": "SizeExceedsMaxSize",
"1e676648f10dc1a4": "Skipped",
"66454e1b96fe0fc2": "SkippedLeg",
"55e6a413a2cde610": "SlashedAmountSpillAddress",
"06b481c83147656d": "Slide",
"63e395f92b28f2ba": "Slip",
"12bcfb32d2168cb8": "SlippageExceeded",
"3863cb74cb399628": "SlippageLimitExceeded",
"9796b1412ca06d29": "SlippageOutsideLimit",
"d48f7810a4b169ee": "SlippageToleranceExceeded",
"4a958da15874f023": "SLND",
"5eee05a545b50685": "SLND_EMA",
"8c3603bb35bdfae6": "Slot",
"0e3eabeced031cb1": "SLOT_DELAY",
"4cf2e46c378477a1": "SlotCycle",
"150e8accfb0ae14b": "SlotHistoryOutOfDate",
"f174b0b3e5cec452": "Slots",
"041fff47f936c781": "SlotsThree",
"af6b4ea4b0d0e407": "Small",
"6a358adacafc590e": "SmallPrices",
"efe7d319302754b2": "SmgMintLogger",
"6c04157c88c76043": "SmgReleaseLogger",
"89d51c85e0a1306c": "Snapshot",
"79aafb2975da744c": "SnapshotFrame",
"de5514629507da91": "SNIPE_FEE_BPS",
"cd8ac239b2b4bbdc": "SNIPE_MIN_FEE",
"5ffe30946b8fb2e9": "SNIPE_PROFIT_SHARE_BPS",
"163980a4d0b861eb": "Sol",
"60528e826edac841": "SOL",
"d349c3c2d4ce9ab0": "SOL_EMA",
"94ff2cf497937692": "SOL_POOL_PDA_SEED",
"e98c966b714f26ac": "Solana",
"7e3a7503ddc04568": "SOLANA_CHAIN",
"6afbdac9f870868e": "SolanaTransferRequest",
"367bec70cb6f3b4e": "Solar",
"95fa900eff1abf3d": "SolayerDelegateNoInit",
"fdce46b014f14cf5": "SolayerUndelegateNoInit",
"99f64892a01c56b2": "SoldOut",
"e37635ffd6e83f45": "Solend",
"709cfd171b79e26b": "SolendSupply",
"506448e996778e7c": "SolendWithLM",
"08e10822630e4739": "SolendWithoutLM",
"4bc7fa3ff4d1eb78": "SolEscrow",
"f86dcff049f80331": "Solfi",
"8854bd34c74bb5d5": "SolFi",
"520205546b539fdc": "SolFiSwap",
"3e9939b724df1582": "SolFiSwapOptions",
"9002ce4d7c80d393": "Solo",
"1c282e6f6cfedcb5": "SoloInteractive",
"4bb3022ade678e9d": "SoloSimple",
"49119c48c64c5f8a": "SolPayment",
"4583cbe95d378292": "SolPaymentAccount",
"e171b4c8d80fdbd0": "SolPoolPdaDefined",
"19f08a905e9a005d": "SolPriceInfo",
"7c2f11256a4f4713": "SOLV_PROGRAM_ID",
"350dff5f8b138241": "SolvBTCVault",
"346e6b2c0a574f56": "SolverFailedToFindRoot",
"4740a30a9c6f36c0": "SOLWalletMustSign",
"fa4d8abb5229e3cd": "SourceAndDestinationMintCannotBeTheSame",
"451e5027d9baf90d": "SourceAndDestValidatorsAreTheSame",
"f2ebdc62fc79bfd8": "SourceChain",
"abb74db3baa63fcf": "SourceChainAdded",
"8351c5270460f7f6": "SourceChainConfig",
"56cb4dbf598d1576": "SourceChainConfigUpdated",
"1cd6facdb84d5805": "SourceChainState",
"ba695d43a99e7ad8": "SourceSolanaStateNotProvided",
"cd9060e88743e4f5": "SourceStakeMustBeDelegated",
"61d4303ea9fa0438": "SourceStakeMustBeUpdated",
"e978a66d269a3679": "SourceStakeMustNotBeDeactivating",
"f40614de85f6a6cf": "SouthAmerica",
"eb38361853f7626c": "Spades",
"db799abece8ea808": "Speculative",
"274906b57faab769": "SpendingCurrencyATACreatedButPassedBalanceIsNotMax",
"0ac91ba0dac3de98": "SpendingLimit",
"851a3d6d79200740": "SpendingLimitExceeded",
"e4d693a35a72025c": "SpendingLimitInvalidAmount",
"4b6be5c71e3bc35c": "Spl",
"a6fe8d2e17dd81c3": "Split",
"e4da25b6b0876254": "SplitLeg",
"6fb171ec2adb3d99": "SplitLegDeeper",
"5055bb8f3e93eaf8": "SplitRequest",
"5d605d006d9c4eda": "SplitStakeAccountInfo",
"003c982d9017c144": "SplitStakeData",
"b98d5d28461ff7dd": "SplitTooManyTokens",
"86d56fa106c36c1e": "SplitWithStake",
"f8cc266c0607fb19": "SplitZeroTokens",
"28d664ef88d8d37f": "SplStake",
"1a1c4f43875723c6": "SPLStakePool",
"68f281727e0697a6": "SplTokenSwap",
"74cca655ebcf003a": "SpokeAirlock",
"5fb588282f8afa3a": "SpokeMessageExecutor",
"e94015e751f034de": "SpokeMetadataCollector",
"9203da6ef579d26e": "Spot",
"1198f04fe3b2c168": "SpotBalanced",
"7a5b8e4f083d84ab": "SpotBalanceType",
"2dc372417f6bf547": "SpotBankruptcy",
"14cdc307d1b45958": "SpotBankruptcyRecord",
"83cd6e44f8776ee4": "SpotFulfillmentConfigDisabled",
"0fcf58896e699fe5": "SpotFulfillmentConfigStatus",
"6f8abc245c6657e1": "SpotFulfillmentMethod",
"453074cbfa8e505a": "SpotFulfillmentType",
"bb643e9cd13d4b91": "SpotImBalanced",
"6f6c38fa9b50081c": "SpotInterestRecord",
"64b1086ba8414127": "SpotMarket",
"a7c4bc3b98c30796": "SpotMarketInterestNotUpToDate",
"d3d12c10bd5975fd": "SpotMarketNotFound",
"ea3d587c53b6f237": "SpotMarketReduceOnly",
"9d17fabee9a34825": "SpotMarketVaultDepositRecord",
"eddafaacc5002bce": "SpotMarketWrongMutability",
"572378185a85d1bb": "SpotOneSide",
"395297421815193e": "SpotOperation",
"ef30a8f8cfcdbf41": "SpotOrdersDisabled",
"28a9219ec496205a": "SpotPosition",
"03031ddf167d4966": "SPREAD_TICKS",
"4a56156953c74330": "SqrtPrice",
"d7249615351edd6f": "SqrtPriceOutOfBounds",
"41589f53e2717559": "SqrtPriceX64",
"70509b3026ff8af4": "SRM",
"bd7790be06e7a4f8": "SRM_EMA",
"e9b1e866d599b35c": "SSOL",
"fba082104571a6a2": "Stabble",
"45a1a93845945a16": "StabbleStableSwap",
"3977281a4a3a4c60": "StabbleStableSwapV2",
"628c6f8d09da666f": "StabbleSwap",
"07a9e2c658e0b66b": "StabbleWeightedSwap",
"192b446ba82fe657": "StabbleWeightedSwapV2",
"c0c29c9cd0c99189": "StabilityCollateralAmounts",
"ba9b64584d51e26d": "StabilityPool",
"c185c9fdfea6c226": "StabilityPoolIsEmpty",
"075cc429868b7e19": "StabilityPoolState",
"fa6271919ad417b8": "StabilityPoolThenRedistribute",
"e252ae019be85f42": "StabilityProvider",
"7d885512303fcc61": "StabilityProviderState",
"23c12e15456f90d5": "StabilityToken",
"a693384e9f4a3023": "StabilityTokenActive",
"7abd93d21ff0f26a": "StabilityTokenMap",
"012dac4b3fa33a0a": "Stable",
"2bbc42011f26121e": "StablecoinMint",
"64733a5340d408ce": "StableLockedAmountStat",
"ef5b5da2ab0e2a42": "StablePool",
"03156629d926efa6": "StableSwap",
"e632d9d7d253443f": "StableSwapIn",
"80c668b2298c0624": "StableSwapOut",
"488b572fe6058961": "StageEmpty",
"479866e001bc9f0b": "StageNotActive",
"cf4ff5764dc8feb5": "STAGING",
"96c5b01d37847095": "Stake",
"b80093e2b6a84c6e": "STAKE",
"509e437c32bdc0ff": "StakeAccount",
"75b3d6a9cc1ce20c": "StakeAccountDelegationLoop",
"d78c48b6533fbec1": "StakeAccountIsEmergencyUnstaking",
"a5a191516e5e396a": "StakeAccountIsFundedToSettlement",
"440bed8a3d210f5d": "StakeAccountMetadata",
"c033cb134cb18861": "StakeAccountMetadataV2",
"c7bed651f1fd92a3": "StakeAccountNotBigEnoughToSplit",
"be5eb86b9809f0de": "StakeAccountNotFundedToSettlement",
"3c35b994eadcb0b3": "StakeAccountNotUpdatedYet",
"c5cc856d15c45c9a": "StakeAccountOwnerNeedsToSign",
"79dde2f0ea50fcd6": "StakeAccountRemainderTooLow",
"089db208127efcbd": "StakeAccountWithLockup",
"bdd72fdbafe4aabc": "StakeAction",
"d262fec49744eb00": "StakeDepositReceipt",
"2c4bc476f51636bb": "StakeDexPrefundWithdrawStakeAndDepositStake",
"624ce14e108fb8f8": "StakeDexStakeWrappedSol",
"6c66bb1365d6eea2": "StakeDexSwapViaStake",
"c0b77ff97594adc2": "StakeDexWithdrawWrappedSol",
"0386816816e35b13": "StakedPythPushWrongAccountOwner",
"9d8c064d59adad7d": "StakedSettings",
"0a8d2655ebe37029": "StakedSettingsConfig",
"a1fabd7a06658100": "StakedSettingsEditConfig",
"c4372e5e885e4420": "StakedWithPythPush",
"bb7f09239b445628": "StakeEntry",
"0faf92561e0862b1": "StakeEntryClosed",
"42684b734ff212ae": "StakeEntryOpened",
"73ad354d2bdb557c": "StakeEscrow",
"d86402f59d32bf1b": "StakeEscrowCreated",
"ecf5d0554bddeaab": "StakeFeeTooHigh",
"52edb99f2ea05a4a": "StakeHistoryNotRecentEnough",
"6f9754cf8524e725": "StakeList",
"5acd505f507678d9": "StakeLockedUp",
"69f38f4900782359": "StakeMustBeUninitialized",
"44673e01c3cc1551": "StakeNotDelegated",
"fd4b7148f419ddf7": "StakeNotEstablished",
"4a6583d28f527ce4": "StakeOnCooldown",
"2384faad3f51efa9": "StakeOrder",
"86ce63626c8cd9c7": "StakeOrderCannotUnstake",
"af2e5844cf36aebe": "StakeOrderNotFound",
"7922ce154f7fff1c": "StakePool",
"01cac2f87499bbaf": "StakePoolNotUpdated",
"e86037dda7ba091f": "StakePoolValidationFailed",
"66569dd7b6a1cd7a": "StakerBalance",
"1b42cf3d804d301a": "StakerBalanceDummyAccount",
"aea30bd096ec0bcd": "StakeRecord",
"9952e0bc90f94470": "StakerMetadata",
"a4295b94e16bebae": "StakerMetadataDummyAccount",
"36384702d8298b2f": "StakeSOL",
"637d4312f0781e99": "StakeSOLCommand",
"8b6ae173bb36cb80": "StakeSOLCommandItem",
"c1eab9e727622bd3": "StakeSOLCommandResult",
"aa976c861af09e6f": "StakeSOLCommandState",
"3f6d96b8afb5b539": "StakeStateIsNotStake",
"8c8dc127e6dff22e": "StakeStats",
"5f2b84efe70dea7a": "StakeStillLocked",
"a1974ef31aa1677a": "StakeSystem",
"25df7622263a71b8": "StakeTransfer",
"89be5c4bd89fb493": "StakeZero",
"f286b7df120db817": "Staking",
"34b2fb9db4ba62ea": "StakingAccount",
"62b935d372476531": "StakingAccountNotMatchedException",
"9a74fc22b37966ca": "StakingInitializationStep",
"be40faab2fed34b2": "StakingIsCapped",
"6b8d6be9e6985d47": "StakingOnNegativeDelta",
"cb13d6dcdc9a1866": "StakingPool",
"c6731398a81d7527": "StakingPoolState",
"91d25f66e47643a3": "StakingRateNotValid",
"15ca960888f802f5": "StakingRateSource",
"b1a1023957a26ec2": "StakingRound",
"32b5f6ab65c6ce1a": "StakingSPLActiveStakeNotAvailableException",
"7b503397b713c8b5": "StakingToken",
"f007ac37b93dfd48": "StakingType",
"9be6b106769f223c": "StakingUninitializedWithdrawTicketNotFoundException",
"82ae3ac279829990": "StakingVars",
"7d185973fb3bfe75": "StakingZero",
"4b64804e83437107": "StaleCommitReport",
"30b521a5ac584c2d": "StaleForAMM",
"d21a8796771a56d1": "StaleForMargin",
"b3c5bf9cf75e8102": "StaleGasPrice",
"85353d4a59c265ae": "STALENESS_THRESHOLD",
"1bb03ef585cd6ad2": "StaleOracle",
"35b51425509fbbe6": "StaleOraclePrice",
"aee008168dbbe438": "StalePositions",
"b1d83e58a623caad": "StalePrice",
"fa88fbfc8c465a36": "StaleProposal",
"33d2a63a2863369c": "StalePullOraclePrice",
"cb5079ca81ed891b": "StaleReport",
"1e022890bda15ef6": "StaleSample",
"3905e420b2c57264": "Stand",
"b749ebb7f004c274": "Standard",
"d683cfd0ca94a230": "Star",
"ccb61de7dc1d3402": "Starbase",
"be5b89fe69f55fac": "StarbaseCrafting",
"a4166ce77ded5ead": "StarbaseCreateCargoPodInput",
"f1d1c97728a1d318": "StarbaseCreateCraftingProcessInput",
"ed629a1ab6a398bc": "StarbaseDepositCraftingIngredientInput",
"a7c7e4621a808447": "StarbaseLevelInfo",
"5ca120644beaa58c": "StarbaseLevelInfoArrayInput",
"27d69eb5b80567bd": "StarbaseLoadingBay",
"c0ea905648130563": "StarbasePlayer",
"13ba914a8ff802dc": "StarbaseRemoveCargoPodInput",
"2e3e6b1440af98b1": "StarbaseState",
"d3b4cf8d4b55a8c7": "StarbaseTransferCargoInput",
"84352b614e3f8e50": "StarbaseUpgradeMaterial",
"5a5528b271a1bcc3": "StarbaseUpgradeNotInProgress",
"57f59dfdaa4b40f9": "StarbaseUpgradeState",
"4b36a64d5b970849": "StarbaseUpkeepInfo",
"b92775f903ec1d76": "StarbaseUpkeepInfoArrayInput",
"3eaf9ddea4bc1f99": "StarbaseUpkeepInfoUnpacked",
"142db6ca1713a8be": "StarbaseUpkeepLevels",
"f04ecba414172335": "StarbaseUpkeepLevelsUnpacked",
"32fd0ba456a527aa": "StarbaseWithdrawCraftingIngredientInput",
"a4ad9e8706abce87": "StargatesNotConnected",
"ac3cbad958b5b620": "StartCraftingProcessInput",
"efdf131f8e75016d": "StartDate",
"200f001b29a9fe25": "StartDelegationClaimBotArgsV0",
"8973b64606af8852": "Started",
"6f8a83ab048e7753": "StartedRound",
"7c9e44e98ad8c588": "StartingPriceTooSmall",
"565c2cf614948a48": "StartRedemptionInput",
"c6e480fcf5598956": "StartSubwarpInput",
"9392092b43cb014e": "StartTimestampAfterEnd",
"b3da542a1a9fdb62": "StartTooFarInFuture",
"bfd59c727a760ada": "StarType",
"d8926b5e684bb6b1": "State",
"609510896b2fb025": "STATE_MERKLE_TREE_CANOPY_DEPTH",
"0424ec21e307c891": "STATE_MERKLE_TREE_CHANGELOG",
"113386a7d7c7651a": "STATE_MERKLE_TREE_HEIGHT",
"15d237306bde45af": "STATE_MERKLE_TREE_ROOTS",
"695086b3a14d0eac": "STATE_NULLIFIER_QUEUE_SEQUENCE_THRESHOLD",
"82c34a95c816f663": "STATE_NULLIFIER_QUEUE_VALUES",
"a9e7cbaeec30ded2": "STATE_SEED",
"dc9babb07424c293": "StateDataV1",
"5659583f4ef3c3f9": "StateMachinePaused",
"b6ef70f921c168b2": "StatementFalse",
"ac2bacba1d49db54": "StateMerkleTreeAccount",
"57261c236b2b1998": "StateMerkleTreeConfig",
"7b37840c19d0d223": "StateNotInitialized",
"5dd7e053f83d8f2c": "StateTransition",
"310aacd208a8e9bd": "StaticConfigParameters",
"774701cb55306f44": "StaticParameters",
"a16e5f60913cd2b1": "StatOutOfBounds",
"be7d333fa9c524ee": "Stats",
"994c48297568aa3a": "Status",
"cd5d84274b93f0ca": "StatusClosed",
"d76281ec74801889": "Step",
"45d14b706e76d1ab": "Step1",
"f832b76b6a3d994c": "Step2",
"5e1106b65c0fc450": "Step3",
"5054962edea4dcb4": "StewardState",
"37d82e319443e41d": "StewardStateAccount",
"80dda86ed17f9438": "StewardStateEnum",
"ca62f19f2ebfd866": "StillHasLoans",
"b048dc85242d483b": "StopCraftingProcessInput",
"dd32ce2710e3592b": "StopLossDecrease",
"f5eaa1a07eaa1b6d": "StopMiningAsteroidInput",
"8179b68f889c6102": "Stopped",
"d5aaa09227664cf3": "StopSubwarpInput",
"d175ffb9c4af4409": "Storage",
"8230f7f4b6bf1e1a": "Store",
"3ba7ec009c1d145d": "StoreOutdated",
"3d0f1cfaa95befce": "Straight",
"ae6e2777526aa966": "Strategy",
"3ecef8ec9cb423c7": "STRATEGY_SEED",
"80cc9a5b08431857": "StrategyBumps",
"b984acf0014d47e2": "StrategyClaimEmissions",
"138fe5cb1c683547": "StrategyConfigOption",
"0aac67651593c1a7": "StrategyDeposit",
"2b5911c4a9e84a16": "StrategyDepositBlocked",
"af6d24c873bdf4be": "StrategyExisted",
"3308c0fd734e70d6": "StrategyInitReceipt",
"f68f985b25c47100": "StrategyInvestBlocked",
"1c8a2a12d3352233": "StrategyIsNotSupported",
"0771b92ab7abe84d": "StrategyManagerWallet",
"e8796374ea06d5e3": "StrategyMetadata",
"10337281cb454c6c": "StrategyNotActive",
"923d2ed31aa9aa12": "StrategyNotActiveWhenDepositing",
"89e9de2cf7dbab0a": "StrategyNotActiveWhenOpeningPosition",
"5110b7370bd496f9": "StrategyNotEmpty",
"7af94a375eb43d30": "StrategyNotFound",
"b8237f65cd4a4a2e": "StrategyNotFrozen",
"d401ba0cf9a00454": "StrategyParameters",
"266bba62971575cb": "StrategyPositionNotValid",
"4562db5f11402511": "StrategyRecord",
"cfa7bbeef988d5ae": "StrategyStatus",
"f54a283a72ccaf97": "StrategyStep",
"72bf49624ff2f14a": "StrategyTickArrayNotValid",
"f54731f38a055077": "StrategyType",
"e2ac0c029f0c90df": "StrategyTypeSelection",
"18fd437338a97166": "StrategyWithdraw",
"ffce5c93c3a1c6ee": "StrategyWithdrawBlocked",
"ea1a49b419e7065a": "Street",
"eb2da236439fea7e": "Strict",
"a712901a6e3d2a27": "StringNotAlphanumeric",
"e5e7c8fef171bfa9": "StSOL",
"207cf44b4fa57190": "STSOL",
"61a16f9e8eef2255": "STSOL_EMA",
"639305bbe5cbb468": "STSOL_TWAP",
"e5ad0ba0c33265c9": "Stub",
"e0fbfe63b1ae8904": "StubOracle",
"97cd5e380d40f156": "SUB_ACCOUNT_SEED",
"2df9b114aafb2525": "SubDaoEpochInfoV0",
"13051f7090d65280": "SubDaoV0",
"0dec0efa72997bb2": "SubHabitatInCooldown",
"bd127f4338b9fa3f": "SubjectCursed",
"cce2d34ad0be9909": "SubjectUncursed",
"35ad2fcc55826251": "SubjectWasNotCursed",
"b2926877548e5eaa": "SubmissionV0",
"648075f82d6bcde4": "SubmitEntryArgsV0",
"9d33219ec3689468": "SubmitPriceArgsV0",
"8453943abca5792d": "SubmitStarbaseUpgradeResourceInput",
"40071a8766846221": "Subscription",
"d6c99528e93a9f89": "SubscriptionType",
"5959f6a876651e03": "Subwarp",
"e92066711b269ced": "Success",
"e7dabee9994d91bd": "SufficientCollateral",
"8379523ac56457a7": "SufficientPerpPnlPool",
"c9e581b26b428306": "SumCheckFailed",
"0afe1b6f393a7692": "SuperAdmin",
"bb3fbcf66cd3d7c3": "SupplementalTickArrays",
"3267c31f41cc6525": "SupplementalTickArraysOne",
"0b3e76c81cea82cc": "SupplementalTickArraysTwo",
"27854d5a38cb5ce5": "SupplyLimitExceeded",
"21f4be6a93fc03c5": "SupportedCollateral",
"aa2ae863b1c63e78": "SupportedCollateralsListFull",
"38a26063c1f5cc6c": "SupportedToken",
"8628b74f0c70a235": "SupportMintAssociated",
"6408817378aef609": "SurplusHasBeenWithdraw",
"ea7fe35a9041556f": "SurveyDataUnitTracker",
"037f825dc97f9672": "Suspended",
"356aff8ac44c03ff": "SVM2AnyMessage",
"aede82d0b9a56316": "SVMExtraArgsV1",
"029eb535d7a4c1f2": "SVMTokenAmount",
"35ce92982c6178b1": "Swap",
"cd863cb0a5b5fd27": "SwapAmount",
"d30138aabf2ab89d": "SwapAmountAndFees",
"193084e89cfe4e00": "SwapAmountIsOverAThreshold",
"5a7217428c9d7aa9": "SwapAmountsTooSmall",
"1845f2d38115c014": "SwapAmountsZero",
"cf8a1cac8a7801b0": "SwapAmountTooHigh",
"18a70b6802be532a": "SwapAndAddCollateralLog",
"91f91bb8a5087cbf": "SWAPANDBRIDGE",
"ae5985f83a15d37f": "SwapAndOpen",
"e9b0472919b260e8": "SwapAndOpenLog",
"356a7cdce089d343": "SwapAndOpenLogV2",
"b4a6427605655475": "SwapApproval",
"6622c50cabb3a24c": "SwapCpiFailed",
"6bfd1781e46c9e20": "SwapData",
"d1404c9537876ad0": "SwapDirection",
"74fd38133787f130": "SwapDiscountBps",
"4f98bfe1806c0b8b": "SwapEndpointDataAccount",
"bfe1e8bd220eeb30": "SwapExactIn",
"9c8f6e061cc5e734": "SwapExactInData",
"d475876f3d9849da": "SwapExactInHintlessData",
"124637c8a0d3e173": "SwapExactOut",
"b7e0ee11a9a9863a": "SwapExactOutData",
"3a2a41d1adf5c12c": "SwapExactOutHintlessData",
"b98995093d52f78a": "SwapExecuted",
"8abf3cf2758dd920": "SwapFeeBasisPointsTooHigh",
"7f384ff570148778": "SwapFeeInternalLog",
"53cdcab2a7c5199f": "SwapFeeInternalLogV2",
"d4804528ac7355ce": "SwapFill",
"3a0ab0945823e7fd": "SwapFromSubAccount",
"fda342dcd7d63791": "SwapImpact",
"e666e22c8d0f369f": "SwapIn",
"cc730606d1e229f2": "SwapInfo",
"2cd06b83979a399e": "SwapInputAmountTooLarge",
"73b14d69220bdaec": "SwapInputInvalidBalanceChange",
"4ea4eaa6cf34f9f0": "SwapLeg",
"1dcfd75019af8f01": "SwapLegDeeper",
"f7d7447459890b05": "SwapLegSwap",
"8ecbbf0cd265b692": "SwapLimit",
"19ab4383b0c934f8": "SwapLimitPriceBreached",
"e8cc6d48f5fd58da": "SwapLog",
"4936bbe651427825": "SwapLogV2",
"42bfbedee642e1f1": "SwapNotSupported",
"ed8155e62cd504cd": "SwapOut",
"97fd35a93aadf4d5": "SwapOutAmountBelowMinimum",
"de197e670551b684": "SwapOutLessThanUserMinimum",
"7613ae058594e32f": "SwapOutMoreThanUserMaximum",
"2c077b5c6f382329": "SwapOutputAmountTooSmall",
"4fc88f829fa1b200": "SwapOutputInvalidBalanceChange",
"28038f2c4f5dadac": "SwapParameters",
"0762a9534a0e9e5c": "SWAPPED",
"ac647166126a21b6": "SwapPoolInvalid",
"3b3ee7e7870c3115": "SwapQuoteNotEqualToActualSwapAmount",
"d8cda8161766aabe": "SwapRecord",
"5b9b8451fb9e5f0f": "SwapReduceOnly",
"018897de0ca5c1a1": "SwapReport",
"9299ddf6d4f0a2d9": "SwapResult",
"48df5091cd260d79": "SwapRewardImbalanced",
"af4481a246f814a1": "SwapRewardLessThanMinimum",
"a5be2b6e0056f7fe": "SwapRewardLessThanRequested",
"d526788e2b1ec4fd": "SwapRewardsBlocked",
"8768eb7f63c4b058": "SwapRewardTooSmall",
"e99f848cc679efcd": "SwapSlippageExceeded",
"ee3f28ff72fe4e78": "SwapSlippageIsOutOfRange",
"d07fcd0b7de4e354": "SwapTickArrays",
"c1e72d0e85f9ff2e": "SwapToBig",
"5374e812bd41659d": "SwapToPositionRatioEstimationFailed",
"c4df7a90a81ec97c": "SwapType",
"5ea2bfab0543bf9f": "SwapUnevenInvalidAuthority",
"98a376bc9dde3557": "SwapUnevenTooEarly",
"56a7d7cedca40eea": "SwapUnevenVaultsBlocked",
"a1dcbda95928465c": "SwapUnevenVaultsOvershoot",
"7cbdfa5c79fe1fd9": "SwapVaultsCashOutputBelowMinimum",
"b2db40ec4b4140bb": "SwapVaultsTooBig",
"45df20db17e0d163": "SwbOracleTimestamp",
"c3b7b85ec1cc8684": "SweepFeesLog",
"7cacf0a8f95cf1a3": "SwiftDestSolanaState",
"38caeebed44ffe75": "SwiftDestSolanaStatus",
"6b95cc80c69b03a2": "SwiftSourceSolanaState",
"5c487ddecb5037d8": "SwiftSourceSolanaStatus",
"bf16d6983686aadf": "Switchboard",
"298050b8e26d0d67": "SwitchboardConfiguration",
"cf40e878d011b87d": "SwitchboardDecimal",
"123c338e7c6dc192": "SwitchboardInvalidAccount",
"eb0374fee31afd8c": "SwitchboardOnDemand",
"4fcfbff45ad5361c": "SwitchboardPull",
"83c4786f902e2ce7": "SwitchboardRandomnessTooOld",
"eaeb977af1556b5a": "SwitchboardStalePrice",
"fdf2f8c81378bd8f": "SwitchboardV1",
"d61e36ac770cbec6": "SwitchboardV2",
"56eab0d362007215": "SwitchboardWrongAccountOwner",
"f39eb6f256070e4d": "SymbolTooLong",
"befd77e34e90c4cf": "Symmetry",
"7a2dbe69bf48f979": "SYSTEM",
"28b9ef118621cc66": "SystemInEmergencyMode",
"d1e01c6f015f860d": "T",
"611c3042f4dc5c0a": "TaggedPayload",
"579e81977d40e0f0": "TakeProfit",
"7c873f262eda3343": "Taker",
"f7513655d3cb9696": "TAKER_BROKER_PCT",
"e168435ec5c4a2ae": "TakerOrderNotFound",
"8cba758c673123b3": "TakerSide",
"f8220aef039ebbb4": "TakingProfit",
"32c5875de6748e44": "Target",
"dd9a7999bc5f3ee1": "TARGET",
"91b0967830837875": "TargetIdMustEqualBidId",
"9d178b75b52cc582": "TargetMetadata",
"1e4d7a4f84093130": "TargetMustBeAboveZero",
"ff78e883a7040766": "TargetWithParameters",
"c3e3cf1455ca625d": "TaskNotReady",
"ce25ab22a2bf2f32": "TaskQueueAuthorityV0",
"6b4d4f0273a04abb": "TaskQueueHasQueueAuthorities",
"7029ae5e305438d9": "TaskQueueNameMappingV0",
"8c34741b6c95cd42": "TaskQueueNotEmpty",
"9618e89f6920a111": "TaskQueueV0",
"b12016222ae68ed5": "TaskReturnV0",
"f25dd5a92a5eef50": "TaskV0",
"7d3553300662921d": "TCollection",
"f79f493ea3184680": "TCOMP_FEE_BPS",
"8cdab18cc1f1c76a": "Team",
"fd947b94010a2577": "TEAM",
"761a782dcc55bd32": "TeamApplicationListFull",
"518804b2e5c40662": "TeamApplicationNotFound",
"93ac3d47000b2bbf": "TeamCannotGrantSelf",
"280ba6a3fd4f6f55": "TeamCaptainCannotLeave",
"b49f28b6faa799b9": "TeamFull",
"293b86c2cf84f0a8": "TeamImmutable",
"984cda3c68c7b728": "TeamJoinCooldown",
"d508fbb303a1e8b5": "TeamManagerListFull",
"b277aa13ab272166": "TeamMemberNotFound",
"9eda75e8c5dc95cf": "TeamTotalOver",
"fd3d6b07933b0378": "TeamTotalUnder",
"5218d3a3a521fc84": "Teaser",
"83ce574eefa79ba9": "TemporalNumericValue",
"25a641c41d6961a1": "TemporalNumericValueFeed",
"26a981e0f067667b": "TEMPORARY_WSOL_TOKEN_ACCOUNT",
"e1a6f11d02a04570": "Ten",
"c5ad885bb6317113": "TermsSignature",
"bbb2061b4ad19149": "Terrestrial",
"ab6d0f2ffb31d2e1": "TesseraV",
"157c9a4ef7de59bd": "Test",
"48cad91eb1d93b24": "Thaw",
"a52c77e639a35db6": "ThawNotEnabled",
"b4a2492b352f97e2": "TheSaleIsOngoing",
"ad9634041a53159e": "ThirdPartySigner",
"eb60a5d09abf36dc": "ThisCodeShouldBeUnreachable",
"ba1b9a6f33249f5a": "Thread",
"98175349f12abd13": "ThreadResponse",
"590dfc0e1de1b6f7": "Three",
"e16411d8c8d19f5c": "ThresholdNotHit",
"232419d64f939fc9": "ThresholdNotMet",
"33fbd1e8b77f9bbb": "ThresholdReached",
"0ff6f35b8f773a40": "ThresholdType",
"b05e43f785ad0773": "Tick",
"0f3ce4f29618b1ae": "TickAccountNotInitialized",
"0acaefea4221a3e6": "TickAndSpacingNotMatch",
"4561bdbe6e0742bb": "TickArray",
"3c9624db61808b99": "TickArrayBitmapExtension",
"fdb1d05e31a0220b": "TickArrayExistInPool",
"79516ea22c569cc5": "TickArrayIndexOutofBounds",
"f78696d9b1459872": "TickArrayLower",
"c07e6857f4b73a2b": "TickArraysDoNotMatchRebalance",
"0c0c9583ce6bd2c9": "TickArraySequenceInvalidIndex",
"c09b55cd31f9812a": "TickArrayState",
"6110d1281b51c475": "TickArrayUpper",
"f58e2fb5a1b71fdd": "TickData",
"854d1262d301e703": "TicketAccountData",
"85fb9e15e219d79c": "TicketNotDue",
"50ae816747f16264": "TicketNotReady",
"cc2cef684e3788ee": "TickIndex",
"7d99e5478d0ef66a": "TickIndexOfBounds",
"1b78924d54ea406a": "TickInvalidOrder",
"743fe7ce8a7165a6": "TickNotFound",
"894cfd8055e26194": "TickState",
"244eb3509c9714a0": "Tie",
"8963917f937765d1": "TierViolationLiquidatingPerpPnl",
"b47c47c1e350e194": "TimeCycle",
"bcd9988e059dd080": "TimeHasntPassed",
"3d035885e90be287": "TimeLockExceedsMaxAllowed",
"14cd0204738c85df": "TimeLockNotReleased",
"68355a8ebec57c14": "TimePointNotInFuture",
"2564bfba2f89ee88": "TimePointOrdersAreIncorrect",
"b30f18c2e3667488": "Timestamp",
"f1d727c70db040ff": "TimestampDecrease",
"8752f8872d76fe74": "TimestampedPackedU224",
"484e925eb54c8210": "TimestampsNotInFuture",
"cf245bde327b9721": "TimeUnit",
"848c087178503d57": "TimeWeighted",
"c921f474e0446128": "TipPaymentAccount",
"fbc3eaba8f99213b": "TipsClaimed",
"c7482192db93b81d": "Titan",
"fa22fdac743c6fbe": "Title",
"3907ca76701cefd0": "TitleNotUnlocked",
"83fe279004b3867f": "Token",
"6c77ac9d13d8ae4b": "TOKEN_CONFIG_SEED",
"0cdeae2d7174b13c": "Token2022",
"40dd8fd0d9b17c95": "Token2022MintExtensionNotSupported",
"d3057213e4b9285e": "Token2022Payment",
"ddbf3ddf97e9016d": "TokenA",
"8f4eb345d938d193": "TokenAccountNotProvided",
"4a1872da547cf806": "TokenAdmin",
"b4fb30b588d4b374": "TokenAllocatedAmount",
"3d5cccea6aeb77ff": "TokenAllocatedAmountRecord",
"c9bdd9df332c586b": "TokenAmount",
"ba1a7d76167f8d77": "TokenAmountExceedsLimit",
"9aedcc0ed2d56981": "TokenAmountForRaydiumLiquidityTooHigh",
"419c4d66733629a6": "TokenAndAccount",
"d254ef34843262fb": "TokenB",
"74dbcce5f974ff96": "TokenBadge",
"5df02259bcf878c9": "TokenBalance",
"97cb41d09ee4e7cd": "TokenBalances",
"26513dc408597b10": "TokenBalancesEntry",
"6d63fe1f1e4ea51d": "TokenBurn",
"3882eef355fded27": "TokenBurnFailed",
"5c49ff2b6b337565": "TokenConfig",
"ce0f95c5488df6c0": "TokenConfigDisabled",
"8a56000412a2100b": "TokenConfigUpdate",
"4112795646345a54": "TokenConfigured",
"f9192aff06aa4c45": "TokenCustodyBurned",
"0a88c70d3b678146": "TokenData",
"2a3c9271155e24e4": "TokenDecimalsChanged",
"7856df992c9ba1d5": "TokenDecimalsOutOfRange",
"d1e5126fc4a3c673": "TokenDestination",
"82879b76d82d11ae": "TokenDisabled",
"e0ca663fb9f28135": "TokenDistributionConfig",
"39727f9cca0ca906": "TokenDistributor",
"02d9fb1671a6a05e": "TokenEnumConversionFailed",
"28755b7cba824969": "TokenExtensionNotEnabled",
"8c621912de8ae456": "TokenFarmTokenMintMissmatch",
"d726892891a9b145": "TokenFlagContainer",
"1a83e89d791947b5": "TokenForNft",
"d2e290c381d04f9e": "TokenForStakersBasisPointsTooHigh",
"4a88136cfe9439b3": "TokenGate",
"6b782683f42d2d59": "TokenGraduated",
"b86b04bbc4378e86": "TokenGroup",
"11d032ad1e7ff55e": "TokenGroupMember",
"6da2347d4da625ca": "TokenInfo",
"812e740c18e40d49": "TokenIsntPresentInState",
"da2e4c3dbcf72f17": "Tokenized",
"18711bfe5fc7017e": "TokenKind",
"9cf709bc366c554d": "TokenLedger",
"bcdb03543ce97556": "TokenLimitExceeded",
"91a799ad05bb9d96": "TokenList",
"fd610541902d3cb7": "TokenMap",
"3671930c850ec151": "TokenMapEntry",
"7e59aae2fca06f1f": "TokenMapExtraTokensNotEmpty",
"6b2b1b18f53e917e": "TokenMapHeader",
"e7f205e555a517cc": "TokenMaxExceeded",
"a204f23493f3dd60": "TokenMessenger",
"edd784b6187fafad": "TokenMetadata",
"bc14a6dd108c13fe": "TokenMetadataConfigured",
"dd6b40674300a516": "TokenMetadatas",
"80f9f1cee85ecd98": "TokenMgrNotPaused",
"6fb33015ba1b646b": "TokenMgrPaused",
"76408dbd97eb5735": "TokenMill",
"1922b39d2a5d164b": "TokenMinSubceeded",
"97e5a3c4b052a703": "TokenMintDecimalsIncorrect",
"7a85543f399fabce": "TokenMinter",
"d75729054bff9e8d": "TokenMintIncorrect",
"8b53552b4905ea32": "TokenMintNotProvided",
"cdf9cfd397d7d5a8": "TokenMultiplier",
"5f71aea7b66c5fa2": "TokenNameTooLong",
"ff394a01a181b8fc": "TokenNameTooShort",
"db7b796f3afaa460": "TokenNotTransferringException",
"11d62db0e595c547": "TokenPair",
"0657bfc41a342fe6": "TokenPairLinked",
"0bf699c4e13a7312": "TokenPairUnlinked",
"85d02f7d50c8f3a7": "TokenPayment",
"9b0254e8a37c7844": "TokenPermissions",
"37b061fbb40893f1": "TokenPoolPdaUndefined",
"0fad2354f94e3dd0": "TokenPriceData",
"d66f71b621cf41fe": "TokenPriceOracle",
"82dce12685130e3b": "TokenPriceUpdate",
"e5131e2c3676f57b": "TokenPriceUpdateIgnored",
"f3186690609d51c6": "TokenPricingSource",
"476157b4f599ffff": "TokenPricingSourcePod",
"7abeb7a14d8600cb": "TokenProgram",
"15e83bda310dd828": "TokenProgram2022",
"511f86967c226da6": "TokenProgramFlags",
"4e8af4ff06f7d1bb": "TokenProgramNotProvided",
"ff70e05cfab7f37b": "TokenProgramVersion",
"ddfa821093fa3b2c": "TokenQuantityExpected",
"61e4a095b9d98026": "TokenRatioOutOfRange",
"ccd1e1233668490e": "TokenRatios",
"daa8b04dc6703423": "Tokens",
"f404637fb7834c34": "TokensAreTheSame",
"90a26fb402c2a8e2": "TokensEntry",
"a40419a48dd7620f": "TokenSettings",
"1bca103e229dcb16": "TokensNotYetVested",
"ef6fa243d06c0df5": "TokenSource",
"e57b15f3f6a439ef": "TokenStake",
"9f1182b2c99f0be4": "TokenStandard",
"077e19e8494fcaec": "TokenStats",
"2d64ef41634c1083": "TokenStatsShouldBeUpdated",
"8790d7a18c7d2960": "TokenSwap",
"0bc75297b3edc492": "TokenSwapSource",
"33b3def1da164b55": "TokenSwapSourcePod",
"b68db2545aaa0c63": "TokenSwapStrategy",
"6f8b5c5386655937": "TokenSwapV2",
"774a21b90d2c9535": "TokenSymbolTooLong",
"f728e86585ef41f4": "TokenSymbolTooShort",
"c2c5f0b7c0a8dfa4": "TokenToSwapNotEnough",
"ff41e3998ce02711": "TokenTransferAdditionalData",
"2066c73ef01dded3": "TokenTransferFailed",
"7c4b3afd4860f914": "TokenTransferFeeConfig",
"7553aa0ea3350d9e": "TokenTransferFeeConfigUpdated",
"bfc5b0b2ff015cd0": "TokenType",
"e7e714daf9499b06": "TokenTypes",
"87189e0fa42c98b6": "TokenURITooLong",
"a2f4a907cfc5e595": "TokenValue",
"03624bef5d89c066": "TokenValuePod",
"790754fe97e42b90": "TokenVault",
"705a8336d5c09135": "TokenVaultIncorrect",
"9ee88a6a498b67c8": "TooBigCreditChunkSize",
"1705e226372e2322": "TooBigValidatorChunkSize",
"16188cabfe601d80": "TooEarly",
"beff8f98663ac561": "TooEarlyForStakeDelta",
"0efb5fd7cdf69e59": "TooEarlyToUpdateDifficulty",
"191e175772011854": "TooFewBetOutcomes",
"2f3aa61f09c1ea42": "TooFewEnabledAttesters",
"e864323baafd5003": "TooFewItemsAvailable",
"1640399a6d5f503f": "TooFewModes",
"d45a57e36284c71b": "TooFewStats",
"28b97bd5db9796ce": "TooFrequent",
"7bf2dc0c49350327": "TooLargeFee",
"2f2533c4d6419eea": "TooLittleOutputReceived",
"9a5eda720ea52b86": "Toolkit",
"17a5ded6ad4a5344": "TooLowCreditFee",
"1433f69f7a86f560": "TooLowDelegationInDepositingStake",
"7e2b4a221567e4cc": "TooManyAdmins",
"177a9927883902ac": "TooManyAuthorities",
"c44cf8f8f6d26ed2": "TooManyBetOutcomes",
"8ba6bfd87916504b": "TooManyConditions",
"c7d2b199efb3ace7": "TooManyCreators",
"b06cf37d56ceb65a": "TooManyExecutors",
"2cd5c70266685337": "TooManyLaunchStages",
"8deb42d193403bb9": "TooManyMembers",
"e90cfdfa7ebb4530": "TooManyMerkleProofs",
"b30d247b61b50582": "TooManyModes",
"5c71f96584e7a928": "TooManyOptionTypes",
"154e1fdb353a0fb7": "TooManyOracles",
"c0bd6d6853878362": "TooManyPositions",
"971ec12817db16e7": "TooManyPublishers",
"05d70d2620405707": "TooManyRaffleStages",
"7514774f424c19e6": "TooManyRaffleTickets",
"e23240f3dd620a20": "TooManyRwaProtocols",
"5211254c6e9fd0b3": "TooManyStats",
"e106c39b5db3b144": "TooManySupplementalTickArrays",
"76e7c9bad1e6f869": "TooMuchExposureToGovernance",
"462f09f076bbe2a7": "TooMuchExposureToIntegrityPool",
"f7a64e6127a928c1": "TooMuchInputPaid",
"a558091832cdefd9": "TooMuchLiquidityToWithdraw",
"17bec8284b7f0614": "TooMuchRwaLeftover",
"c628f52fd90c8e05": "TooMuchShares",
"f8bb13fa8580e869": "TooMuchSpent",
"c8d06a55e54535b0": "TooMuchUsdcLeftover",
"20e861dd9e0c24e4": "TooSevereLiquidation",
"bca49d904b1e755b": "TooSeverePayoff",
"a30e03741ded3712": "TooSmallInputOrOutputAmount",
"13e675fd15876ddc": "TooUncertain",
"a67a928b39f0c280": "TooVolatile",
"3654a2a42c735aef": "Top",
"81cb27efeac5d74a": "TopListMetadata",
"09e279f498e814e1": "TopPlayerAccount",
"6845d59772363059": "TopStakerInfo",
"4957b335819d1a4b": "TopTeamAccount",
"72e7ae693146386b": "TotalAmount",
"5de8841355ecb81d": "TotalBaseTokenExceedMaxSupply",
"2ae0be4ffd06c98b": "TotalBorrowing",
"303a8c7b6aa77df2": "TotalDebtTooHigh",
"5513f2a54e361f21": "TotalDepositTooHigh",
"4667c8b503144c8d": "TotalRedemptionLimitExceeded",
"0a8f54d8b995763c": "TotalSupplyOutOfBounds",
"56734dd392637b66": "TotalWeight",
"ce3e54c05ed209cd": "Tower",
"166276771ae6dc71": "TowerPaytable",
"aa9aae6b324ee896": "TrackConfigV0",
"aa4244969887cfa8": "TrackDcBurnArgsV0",
"0920aa481b05b0b8": "TrackDcOnboardingFeesArgsV0",
"0b613e14b82c242e": "TrackSharesInvalid",
"474b20ecb7751a7f": "TrackStateV0",
"a8b85697e73fc74e": "TrackV0",
"848b7b1f9dc4f4be": "Trade",
"1d1e1085f766ab59": "TradeAmountTooLow",
"745734800d3cda46": "Traded",
"e216a334f3dfbb4a": "TradeData",
"ca5b4db1021ae7ca": "TradeDirection",
"e47fbab659ca937b": "TradeEventType",
"3e49984f3444fff9": "TradeFees",
"4e06a036b7fbfcad": "TradeIsNotEnabled",
"7e4103c9b24fc653": "TradeOutputAmounts",
"d735d228d707ca2f": "TradePnl",
"c52a871e419c7a63": "TradePoolType",
"5988afff4097a66a": "TradePrice",
"daf9f1b41c8fa1d4": "TradePrices",
"519b6acf38d566ae": "TradeReceipt",
"b78bd0a84176657d": "TradeRentPayerConfig",
"9f0e3bd0c4513c1d": "TradeSize",
"4377f43266564c1a": "TradeSizeTooLarge",
"a6ac09612135a96b": "TradeStats",
"44ff932c70dd3ccf": "TradeType",
"511ea3ae8cf2ef68": "Trading",
"0bdf4c2942a6a464": "TradingStats",
"927dfda7fae2af7b": "TransactionAccount",
"3229310853be3939": "TransactionForAnotherMultisig",
"9a188802f8f04ce0": "TransactionMessage",
"31c85a4bacc9d190": "TransactionNotLastInBatch",
"48fa82def16f133e": "TransactionNotMatchingProposal",
"2614b4fae913ad02": "TransactionSourceV0",
"79fd41ac3b2c7c81": "TransactionTooOld",
"b2300746026c55c9": "TransceiverPeer",
"afc499a0d15a9197": "Transfer",
"f06b209e89ac1646": "TransferAccountsIssue",
"74d4ea905eee8988": "TransferAdmin",
"a587b253ebbf61a5": "TransferArgsV0",
"56625c73255288d5": "TransferCannotBeRedeemed",
"56dd534824688cfc": "TransferCargoWithinFleetInput",
"27dbe71a4ae99f4d": "TransferDelegate",
"99a463d851b0d342": "TransferDirection",
"f519e91c74bce98a": "TransferExceedsRateLimit",
"e9410ebc32f0c853": "TransferFailed",
"d069e9594e95c270": "TransferFeeCalculateNotMatch",
"53e197f4f32057b8": "TransferFeeCalculationFailure",
"47b2bda472aa63a9": "TransferFees",
"8717ce14022d96b7": "TransferHookA",
"9f13fc45a24e8543": "TransferHookB",
"d56b9407fb16faaf": "TransferHookEscrow",
"74c9d939beea9f3e": "TransferHookInput",
"411131637cf9cf2b": "TransferHookIntermediate",
"9156da6dee18a620": "TransferHookOutput",
"95f8c263accba7ce": "TransferHookReward",
"43804d19c6b88ff8": "TransferHookX",
"a618d54738131053": "TransferHookY",
"74703b2f148d7e8e": "TransferNativeSolToUserATAFailed",
"30498864dcb698ba": "TransferNotApproved",
"e87b4af4c1440391": "TransferOut",
"4904dd29caef5410": "TransferPerpPosition",
"96bc8938dcae01c0": "TransferPosition",
"907535fa0e14490d": "TransferProtocolIfSharesToRevenuePoolRecord",
"c87958ca0ca0ed0c": "TransferRequest",
"68eeafdc67cc2723": "TransferTaxMint",
"9772b33589613b22": "TransferTeamCaptaincy",
"68342f74ff34732a": "TransferVestToMyself",
"60b3454280814975": "Transmissions",
"6a9beec38d11608c": "Transmitted",
"eeef7bee5901a8fd": "Treasury",
"cc8c12ad5a98867b": "TreasuryAccount",
"3926aa88ff11ae94": "TreasuryAmounts",
"38fbe85e80c53b96": "TreasuryAuthority",
"d781d8fdbeb2004d": "TreasuryCutIsTooHigh",
"981f0af77e7941a5": "TreasuryFee",
"a31810201b05be68": "TreasuryFeeRate",
"92a3de18fb40d420": "TreasuryFeeVaultReceiver",
"beaeb5694f559fdc": "TreasuryNotOwnedByBuddy",
"013eebdd9d1849f9": "TreasuryOwner",
"ef0af36cf981d41d": "TreasuryVaultConfig",
"a734606042a19200": "TreeAuthorityIncorrect",
"7af5aff8ab2200cf": "TreeConfig",
"27515714891c3d7d": "TreeNotFull",
"4d9b2390260e6a58": "Trigger",
"6e7df86d651bedc3": "TriggerContext",
"67223fbcb9a18c6b": "TriggeredAbove",
"623f40fd72d787b8": "TriggeredBelow",
"4ba1a3683b811af1": "TriggerLimit",
"4a1cfbce94395d44": "TriggerMarket",
"ec3d2abe980c6a74": "TriggerOrder",
"8abf3814185e033a": "TriggerPriceSlippage",
"551dedf1e242fbcd": "TriggerV0",
"05a81abb76416a7c": "TrimmedAmount",
"e08fd2f660c3c883": "Triple",
"d217a7fac021ea28": "TrustedSignerInfo",
"1ea3da31346075ce": "TryingToRemoveLiquidityTooFast",
"57a98b520b0a8c5d": "TryLiquidateBlocked",
"5fb0019d218ffda8": "TryLiquidateEventCash",
"59108fa1bd99c376": "TryLiquidateEventCashWithTimestamp",
"ba0e8ff09f525448": "TryLiquidateResult",
"60911c84db9d9b0c": "TryPostOnly",
"653ac06b2a66bf31": "TrySettle",
"d141fd3ca1cccb8b": "TryToSerializePriceAccount",
"a9d3ab24dbbd4fbc": "TSwap",
"e7f35738c49c2f89": "TSWAP_SIZE",
"f49b1060d6b28af9": "TSWAP_TAKER_FEE_BPS",
"b0fc503316a816d8": "TSwapConfig",
"2850d61b35e48c37": "TTokenProgramVersion",
"98e610a92b5bb013": "TTokenStandard",
"c6ff8acffc953c01": "TuktukConfigV0",
"88528bc2102432a9": "Tulip",
"7c951807c3a8993a": "TunaConfig",
"4cc5a133e80f89dc": "TunaPosition",
"6010a7cf312f3b14": "TunaPositionState",
"6f11fd511baa84d7": "TUseMethod",
"6b908d16547f53cd": "TUses",
"12fbff28e776d3fe": "TvlLimitReached",
"c91ce79f11b9548f": "TWAP",
"4be0b4869dec62d0": "TwapDivergence",
"315417e8d38d7f5e": "TwapNotEnoughSamplesInPeriod",
"28c7a188be023d90": "TwapOracle",
"70481484a02e0e84": "TwapPeriod",
"882dec0e5e9a035d": "TwapSampleTooFrequent",
"f299d6ed8f3e210b": "TwapSourceIndexOutOfRange",
"c7e20fa8b33641d7": "Two",
"6666ad3f4db092e8": "TxHistory",
"4dae8447effac67a": "TypeCastFailed",
"2f48c737092e11fb": "U128",
"36994c97175bb4aa": "U128Split",
"916437c9dafee8af": "U16",
"1f711f5e0f8575f4": "U32ValueChange",
"93db942241b8f0f6": "U64",
"4a416a4a9b3453fa": "U64ValueChange",
"872dbadaa89a0f23": "U8",
"24dd70d68d4d75d9": "U8Array",
"361c27af81074064": "U8Bool",
"97055bd49b901a0c": "UlnConfig",
"e2c764fd2673a79a": "UlnSettings",
"8e272e7f829cf601": "UnableToBurnLPTokens",
"38e92025d090774b": "UnableToCastUnixTime",
"cf320785231f5464": "UnableToConvert",
"06c4ecbd322fc077": "UnableToDerivePDA",
"71eb4fee47340c09": "UnableToDeserializeAccount",
"3ef1767e939c520e": "UnableToDeserializeAccountData",
"bd2093a83e315e45": "UnableToGetLimitPrice",
"d3928735e32edd84": "UnableToLoadAccountData",
"a7b95f231a82fc24": "UnableToLoadAccountLoader",
"a2370097e46953ec": "UnableToLoadOracle",
"432c0514ff1d52b3": "UnableToLoadPerpMarketAccount",
"aa6fec4788abc8b3": "UnableToLoadSpotMarketAccount",
"41f948c66e70cfa9": "UnableToLoadUserAccount",
"2eeb23bdf58eabc6": "UnableToLoadUserStatsAccount",
"f99434d3d9f5d43c": "UnableToModifyActivationPoint",
"bdd6711f07ae574b": "UnableToParsePullOracleMessage",
"91b56c3cc7a9594f": "UnableToVerify",
"36337d074b892dfd": "Unaligned",
"37905f6dd824dd30": "UnauthorisedOperator",
"563f844fd07dc507": "UnauthorisedOracle",
"07da8a988a9bf8ac": "UnAuthorized",
"68141b265a5ca11d": "Unavailable",
"a7f9ba8e9990800d": "Unbalanced",
"4e1266dc1983295f": "Undefined",
"045799210d02fd16": "Undelegated",
"043c42cee4072470": "UndelegateVST",
"048f585685b212cf": "UndelegateVSTCommand",
"921cb8a4049883d6": "UndelegateVSTCommandItem",
"00fd0ba130bd79f4": "UndelegateVSTCommandResult",
"cc402e3871b80c65": "UndelegateVSTCommandResultUndelegated",
"0a0e9f95a81a9a1d": "UndelegateVSTCommandState",
"4beef035d93975b1": "UnDenylisted",
"f713a093336b6000": "UndercollLiquidationBlocked",
"67f2ba5d6956e7d1": "UnequalMarketIndexForSpotTransfer",
"be63cf10b7f2b36c": "UnexpiredExecuteHash",
"ed6d8d5c5edf3fc8": "Unfreeze",
"662c995383e1e80c": "Unfrozen",
"f4f130a08cf930c6": "UnharvestedAmounts",
"52adc493b679e77f": "Unhealthy",
"4c08a092999b0568": "UnhealthyElevationGroupLtv",
"1b36a7db04925bc3": "Uniform",
"da90180adf11709d": "Unimplemented",
"84edb17eb33c1a99": "Uninitialized",
"c32cf95675e4cbf0": "UninitializedAccount",
"b99b7433cb043378": "UnInitializedRewardInfo",
"96c3780a5d9d433e": "UninitializedStake",
"8c486e3404ee2444": "UninitializedTokenAccount",
"65d99c61c872e091": "UniqueOwners",
"581d4b5197a0b8b2": "Unknown",
"3b7f3bc8111801c2": "UnknownAccount",
"3d68c3c2fe79e457": "UnknownActionState",
"ecabb6e1553f6c49": "UnknownDecreasePositionSwapType",
"7ce87eae6f90fa4f": "UnknownInstruction",
"f4ccab6d4f5cc14a": "UnknownOracleType",
"2462f7cee32367f8": "UnknownOrderKind",
"00106beba92dbbe9": "UnknownOrderSide",
"eeba1e301f614e28": "UnknownPermission",
"3666ff716909a30b": "UnknownPosition",
"032e2289d9a112cd": "UnknownToken",
"597df68de83086d6": "UnknownTokenProgram",
"959a8655a33d9e7c": "UNLIQUIDATABLE",
"9703149fc7bc0848": "Unlisted",
"543d07c4ddbf3415": "UnlistedLoan",
"decce8a686899269": "UNLOCKED",
"693db72133d81801": "UnlockFunds",
"af3ecfd163c1c646": "UnlockNotEnabled",
"8ddc661ef043647a": "UnMatchReserve",
"a6b1ee4de5a18d07": "UnmatchTokenMint",
"6958a77964cf8a4f": "UnparsableAccount",
"f25eb706f6f0f314": "Unpause",
"8d86c860b00fcf5a": "Unpaused",
"8a2d506310e455e5": "Unpauser",
"e3077c251c763572": "UnprocessedRedemptionRequests",
"761d3a8a562331b8": "UnprofitableArb",
"3ad88673fb69b424": "Unreachable",
"6a9242d19a0efe33": "UnrecognizedProgram",
"6acebbaf9f00f3d2": "UnregisteredLPMinted",
"8efcedd4d52e32d6": "UnregisteredMsolMinted",
"b1441afc7447dbbe": "UnresolvedStake",
"7e2692c449c9c033": "UnrestakeVRT",
"7c8bc6a8af79e61c": "UnrestakeVRTCommand",
"c59906fbb05a7200": "UnrestakeVRTCommandResult",
"f3675c34af9028be": "UnrestakeVRTCommandState",
"92abb604049b6f02": "UnrestakeVSTCommandItem",
"f1ba1624478eb719": "Unset",
"6833c1ced43cad63": "Unsigned",
"750577543ea06d28": "Unsorted",
"9a94834334f4f413": "Unstake",
"7a882bd2b56ae9a9": "UnstakeCancelRequest",
"d79e8fdb88975b90": "UnstakeCreated",
"b28ad7f7d6105141": "UnstakeInstantLog",
"462a1aa261bb8ed8": "UnstakeLST",
"70a7952f5f1cf149": "UnstakeLSTCommand",
"9aab94648f5a8d6d": "UnstakeLSTCommandItem",
"166b53ff23bd7a70": "UnstakeLSTCommandResult",
"555596c7380842e8": "UnstakeLSTCommandState",
"0c75a5235c08a7d2": "UnstakeNotElapsed",
"7f2217bfd3feca2a": "UnstakeRequest",
"707fc0e8bb0d1d94": "UnstakeRequestLog",
"95c3a42284b1786f": "UnstakeTokenInstantLog",
"8f27c5f0feb3edcb": "UnstakeTokenRequestLog",
"5c3725fe92628f47": "UnstakeTooEarly",
"99f7c0f7b5630f90": "UnstakeTransfer",
"38755c7541bde2ea": "UnstakeZero",
"bbac134bb2d20532": "UnstakingOnPositiveDelta",
"73ac8c5459d9ef44": "UnstakingTicket",
"8a2224f95b4db14e": "UnsupportedAdditionalBytes",
"4c5d9624e8f39e7e": "UnsupportedAssetPlugin",
"f27201e03e84e26f": "UnsupportedCanopyDepth",
"884af0b64a7d5396": "UnsupportedCloseThreshold",
"d7e3f9a63efc5a15": "UnsupportedCurveOperation",
"2c7fb89a2d2b97cf": "UnsupportedCurveType",
"6974a07b776681a5": "UnsupportedCustody",
"06226f2226af2088": "UnsupportedDestinationChainSelector",
"2a824eaa400845a0": "UnsupportedDex",
"4fdcbe0c472b5fa0": "UnsupportedDexForToken22",
"4e232d3b54948217": "UnsupportedFeature",
"00d4184c21904dbe": "UnsupportedHeight",
"850183d4e32dc3a4": "UnsupportedIpFormat",
"f09b43a9dc346edf": "UnsupportedMarket",
"41fa7c238317a3d5": "UnsupportedMessageType",
"5094aec24af135ec": "UnsupportedMint",
"f453b9992cec59a0": "UnsupportedMintExtension",
"5c132e9a8d9c9e1d": "UnsupportedNumberOfTokens",
"9fcad2d5227a9966": "UnsupportedOperation",
"a222891903d795d6": "UnsupportedOptionType",
"eeba8c4353082e51": "UnsupportedOracle",
"fc499583bc14a5dc": "UnsupportedOracleMessage",
"b8de44c69b376851": "UnsupportedPool",
"ea9f7b17f72e7bca": "UnsupportedSchemaVersion",
"cf092947ee3e3c12": "UnsupportedSourceChainSelector",
"5f02ed901c056906": "UnsupportedSpotMarket",
"575209f93e94beab": "UnsupportedToken",
"c137d252455a61c4": "UnsupportedTokenExtension",
"592535dd4a8bbc9e": "UnsupportedTokenExtensions",
"a1231f3ee740f0e3": "UnsupportedTokenMint",
"f2503bb4cfa8c7c3": "UnsupportedTokenProgram",
"bcefe19279dd693d": "UnsupportNativeMintToken2022",
"40203d53feaada5e": "Untouched",
"db14fce654079247": "UnupdatedCargoPodAccount",
"6c052ad9199c3d69": "UnupdatedTokenAccount",
"fd9797d0f1a84f53": "Unused",
"5446356f0c46a236": "UnusedDepositEntryIndex",
"62f6ec437b973d45": "Unverified",
"86155eb6cfdb5acb": "UnverifiedPublisherCaps",
"9e454197515b75c0": "UnverifiedPythLazerMessage",
"14d374dd3356f87c": "UnverifiedVaa",
"37f710c2b69a7604": "UnWhitelistedMint",
"9bd058c9c1c102ca": "UnwrapCooldownNotPassed",
"26bc443c81ea826c": "UnwrapCooldownTooHigh",
"48d48bc98bd9fd73": "UnwrapRequest",
"e460145efeb5d894": "Up",
"e1da3775fa4ddc4a": "Update",
"a3b706b77f55fa53": "UpdateAccountWindowedBreakerArgsV0",
"7102301c6efd3082": "UpdateAdminAuthority",
"442256eeba4ecc67": "UpdateAdminAuthorityCached",
"0ed4e51c0275036a": "UpdateAMMCurve",
"0699b9cffd1cba8f": "UpdateAssetTier",
"b5de81fb154b4c78": "UpdateAtaCreationCost",
"50aeabedc9f83ae1": "UpdateAuthority",
"fb32ef185dc3821e": "UpdateAuthorityIncorrect",
"ff94805a092ff27e": "UpdateAutodeleverageEnabled",
"a56c2a3906a9e364": "UpdateBadDebtLiquidationBonusBps",
"99103adbcc242dd3": "UpdateBlockBorrowingAboveUtilizationPct",
"269eacb1cddde6ea": "UpdateBlockNewOrders",
"b351d110f5e4e846": "UpdateBlockOrderTaking",
"39bea9bd5aacee67": "UpdateBlockPriceUsage",
"46c8311f3e51ff1c": "UpdateBmsConfig",
"f1274cf597e34793": "UpdateBorrowFactor",
"77e245069fb8566c": "UpdateBorrowingDisabled",
"d8a0d2a5a5c910f4": "UpdateBorrowingReport",
"3a716861ab8323f7": "UpdateBorrowLimit",
"a613177d00bd4ba8": "UpdateBorrowLimitOutsideElevationGroup",
"ed0a6f22c2aa37a5": "UpdateBorrowLimitsInElevationGroupAgainstThisReserve",
"807d16532fe10cc5": "UpdateBorrowRateCurve",
"95a527446974d0b2": "UpdateCarrierArgsV0",
"0c16089fcb6317a8": "UpdateCarrierTreeArgsV0",
"b7ccb2c5433559a7": "UpdateCollateralInfoMode",
"062df55f768fb665": "UpdateCollectFeesFee",
"391424202c40f392": "UpdateCompressionDestinationArgsV0",
"8761fa92c5444f02": "UpdateConfigMode",
"f1ca3c674d1c404c": "UpdateCounterparty",
"00069497515bfee3": "UpdateCraftingFacilityInput",
"9a0446b82cf24dfa": "UpdateCumulativeInterest",
"b6e8a570f8f937a4": "UpdateCurrentWeights",
"6bc6282cc892b384": "UpdateCustody",
"97f7e9479bd30ca1": "UpdateDaoArgsV0",
"bbe1b2f7ea0f1734": "UpdateDataCreditsArgsV0",
"4a7c30b64c871afb": "UpdateDebtMax",
"1968d344d987a7cf": "UpdateDebtWithdrawalCap",
"2713eb04b557d41a": "UpdateDefinitionInput",
"43e36c32d3f11c37": "UpdateDelegate",
"bf8590d46f0bb542": "UpdateDelegatedRpsAdmin",
"7ed330e020fabc09": "UpdateDeleveragingBonusIncreaseBpsPerDay",
"a5daef89e8db32b4": "UpdateDeleveragingMarginCallPeriod",
"158ec176701ddd84": "UpdateDeleveragingThresholdDecreaseBpsPerDay",
"97a0e36409fb255b": "UpdateDepositBlocked",
"c38eafd10ea2f3e1": "UpdateDepositCap",
"c2ec42b95be82df4": "UpdateDepositCapIxn",
"88b40d724e076c2b": "UpdateDepositFee",
"63405dbcb3783f86": "UpdateDepositLimit",
"be421ac8f4478bfd": "UpdateDepositMintingMethod",
"b4700ba5328b1031": "UpdateDepositWithdrawalCap",
"04c8f13076419c08": "UpdateDisabled",
"66b19bce2be1c3d6": "UpdateDisableUsageAsCollateralOutsideEmode",
"8e81cf0cbf1dcc80": "UpdatedValueIsTheSame",
"7cac849e2ee657e2": "UpdateElevationGroup",
"aac92b7b2fdcc779": "UpdateEmergencyMode",
"de8bc2165884317b": "UpdateEntireReserveConfig",
"c6232da659fd89f4": "UpdateExtraDelegatedAuthority",
"ce664960aee1e88e": "UpdateFarm",
"aa7c243f5c8d1935": "UpdateFarmCollateral",
"05b5fe996f97bed4": "UpdateFarmDebt",
"8a51b94fb0446802": "UpdateFeesBorrowFee",
"ade0a84fdbf5fad8": "UpdateFeesFlashLoanFee",
"2e707cf510517431": "UpdateFlashTakeOrderBlocked",
"9a763eafebb5f08e": "UpdateFlashVaultSwap",
"204ea8d26da61dcf": "UpdateFunding",
"f89dbfc42bccc653": "UpdateFundingReport",
"bd2b69d1a75304b6": "UpdateGameInput",
"8293bd7ba7f26433": "UpdateGameStateInput",
"c5cc7931a92e267d": "UpdateGlobalAllowedBorrow",
"09cd133c584595e8": "UpdateGlobalConfigMode",
"78273c29748b2010": "UpdateGlobalConfigValue",
"4898db64bb6ba706": "UpdateHighLeverageMode",
"0b9e74c3c2ee2ff4": "UpdateHostFeeBps",
"f6b457523eb9a10a": "UpdateHostFixedInterestRateBps",
"407f1736001dc17d": "UpdateImmutableFlag",
"67d5607cf341748c": "UpdateIndividualAutodeleverageMarginCallPeriodSecs",
"b4ba93649c20a71f": "UpdateInitialDepositAmount",
"73ba944b035daefa": "UpdateInsolvencyRiskLtv",
"ea2dbbb190fb1886": "UpdateInvestBlocked",
"0a32244597b5aa83": "UpdateIotInfoArgsV0",
"8a3c0a88324e2dd9": "UpdateIsCommunity",
"28a7377cacfb72fb": "UpdateLastEventTimestamp",
"62aaf4afdd9dfa67": "UpdateLazyDistributorArgsV0",
"48883f13bda10afa": "UpdateLendingMarketConfigValue",
"30499d12376d4524": "UpdateLendingMarketMode",
"467a6b9e2712efcf": "UpdateLiqPenaltyCashBased",
"9e4e3fce8148475e": "UpdateLiqPenaltyPoolBased",
"e7f3eafd627b897e": "UpdateLiquidationCloseFactor",
"b21f7693102785dc": "UpdateLiquidationMaxValue",
"78dfdbd1321eeba1": "UpdateLiquidationThresholdPct",
"17532ebb422bda7f": "UpdateLoanToValuePct",
"e272bd1b8f938e53": "UpdateLocalAdminBlocked",
"50cb53caef60eb99": "UpdateLookupTable",
"ac22054d4dec1b6d": "UpdateMakerArgsV0",
"5689aad1e84371ab": "UpdateMakerTreeArgsV0",
"590e3ec9c64a8175": "UpdateMarketMcr",
"75da5005430465c0": "UpdateMarketType",
"3988577dccfe82c8": "UpdateMaxDeviationBps",
"a2f181fdd6fe701e": "UpdateMaxIgnorableAmountAsReward",
"f031cdd7b4e207cb": "UpdateMaxLiquidationBonusBps",
"37e591786952b537": "UpdateMessage",
"0f008f47b9e016fb": "UpdateMineItemInput",
"9f1c9a695efbf75f": "UpdateMinFullLiquidationThreshold",
"4958bf81e3fadfdf": "UpdateMinLiquidationBonusBps",
"ed2f0b679861b5a4": "UpdateMinNetValueObligationPostAction",
"6369a9500950ca3d": "UpdateMinPartialDebtAccepted",
"038e1a45a2c1658f": "UpdateMintingFeeBps",
"f7077899567267a6": "UpdateMintWindowedBreakerArgsV0",
"9e4bee42a0852b8b": "UpdateMinValueBfSkipPriorityLiqCheck",
"7e8273344dee2f3f": "UpdateMinValueLtvSkipPriorityLiqCheck",
"642ea485500d2024": "UpdateMobileInfoArgsV0",
"50a331275e30fd8e": "UpdateName",
"804ef622ce543d92": "UpdateObligationOrderCreationEnabled",
"6f2425631c7bd67e": "UpdateObligationOrderExecutionEnabled",
"8b5dc1ed1a21d076": "UpdateOrderCloseDelaySeconds",
"2c1642f27200e797": "UpdateOrderMode",
"84cc02f4ba8547c0": "UpdateOrderTakingPermissionless",
"35d37fd4f4dfb569": "UpdateOwner",
"e0a0824bfd09d8d5": "UpdatePackTiersInput",
"b2a0260b7e805632": "UpdatePaddingFields",
"1602b186dd4d8bb2": "UpdatePendingFarmAdmin",
"44bbbd51ce48c86d": "UpdatePendingStrategyAdmin",
"72347e83f721a870": "UpdatePermissionless",
"bf630535a4e7aaea": "UpdatePlanetInput",
"bd3d8800a485a94a": "UpdatePointCategoryInput",
"d89ec0c6eda16894": "UpdatePolicyArg",
"259fc886af53c7a5": "UpdatePositionLockReleasePoint",
"d3f82914f35f7c10": "UpdatePositionOperator",
"ffee5be559c94cb6": "UpdatePriceMaxAge",
"5c9c94cb07cb7967": "UpdatePriceOracleArgsV0",
"7d7bd5fa76c25b05": "UpdatePriceRefreshTriggerToMaxAgePct",
"adb76aae6365652c": "UpdateProgressionConfigInput",
"3a8bba692973397b": "UpdateProtocolLiquidationFee",
"5eaa26c59179bf74": "UpdateProtocolOrderExecutionFee",
"99fe3bb72b190b00": "UpdateProtocolTakeRate",
"753d183f826ea809": "UpdatePythPrice",
"f09714907b9cd4f1": "UpdateRaydiumPoolConfigOrBaseVaultAuthority",
"1c98515bdc1ad398": "UpdateRaydiumProtocolPositionOrBaseVaultAuthority",
"b4ba1ae6e000f181": "UpdateRebalancesCapCapacity",
"53fc6696a414a842": "UpdateRebalancesCapCurrentTotal",
"4b4eaa34918f127a": "UpdateRebalancesCapInterval",
"41e34d9f98088c29": "UpdateRebalanceType",
"370242b89375543e": "UpdateRecipeInput",
"b1cd056ec6b89285": "UpdateRedemptionEpochInput",
"aa0fb47ed7f322df": "UpdateReferencePriceType",
"f18ba2b9102ad6d5": "UpdateReferralFeeBps",
"c0a5bcfb55e27fa7": "UpdateReserveStatus",
"39da3d546c49858a": "UpdateResourceInput",
"afd3675d93249db1": "UpdateReward0Amount",
"8ac8e7b5a0af7220": "UpdateReward0Fee",
"f9da651f3f19fbc4": "UpdateReward1Amount",
"046fe2ae2edbc9e5": "UpdateReward1Fee",
"9c3ff43932a0c973": "UpdateReward2Amount",
"51cd145792408274": "UpdateReward2Fee",
"d736bc57b9703897": "UpdateRewardableEntityConfigArgsV0",
"3d7a34bbfd964cca": "UpdateRewardDuration",
"f8685a06e321dd13": "UpdateRewardFunder",
"970dfa34a9564e6a": "UpdateRewardMinClaimDuration",
"c4974d6e137b6235": "UpdateRewardRps",
"a13eed1039105845": "UpdateRewardScheduleCurvePoints",
"bc495bbbf935cb36": "UpdateRiskCouncil",
"df659fc8fab56584": "UpdateScopeChain",
"5d7b193dfea79f65": "UpdateScopePriceFeed",
"40d60b263bec74ab": "UpdateScopeTwap",
"ea72ec5917ecd74c": "UpdateSecondsToFullUnlock",
"dee5b86c61d70b08": "UpdateSFValue",
"62dc182397c8b2fa": "UpdateShipEscrowInput",
"24b56ea115e02c3c": "UpdateShipFleetInput",
"5687e7aaf934e156": "UpdateShipInput",
"8ff8e42dca1cd0af": "UpdateSlip",
"2ee323f5f1d6738f": "UpdatesNotMonotonic",
"bc530d88ab7c390d": "UpdateStabilityPct",
"837e9cb98e789ba4": "UpdateStakingPct",
"a6b769f1942f181e": "UpdateStakingRateChain",
"d67161b29fae2bf3": "UpdateStarbaseInput",
"7d764a1e3a7afe9a": "UpdateStarInput",
"16bbbe9d08c20851": "UpdateStatus",
"48ce0123d0155766": "UpdateStrategyCreationState",
"fa389128bb1911fe": "UpdateStrategyId",
"326c2603866c8cb3": "UpdateStrategyType",
"182dd295c8c33dec": "UpdateSubDaoArgsV0",
"7bd7c53ad5241fda": "UpdateSubDaoVeHntArgsV0",
"f81a06fe424e5014": "UpdateSurveyDataUnitTrackerInput",
"4f6c40e825baf165": "UpdateSwapUnevenAuthority",
"3329bce07cf97c15": "UpdateSwapVaultMaxSlippage",
"f51281f9262dcc5e": "UpdateSwapVaultMaxSlippageFromRef",
"8beabfcb1f2788db": "UpdateSwitchboardFeed",
"b3fd773c3d9b0d00": "UpdateSwitchboardOraclePrice",
"add5b41b3b173a37": "UpdateSwitchboardTwapFeed",
"776e175cfae996ff": "UpdateTaskQueueArgsV0",
"70af1fc45b372e1f": "UpdateTimeConstraint",
"1a6f8700cafd2792": "UpdateTokenInfoExpHeuristic",
"7b198da4f7a779b6": "UpdateTokenInfoLowerHeuristic",
"fd270e525c5c8d8a": "UpdateTokenInfoName",
"f408157ecff1c2c8": "UpdateTokenInfoPriceMaxAge",
"82c5b563b4d8d6af": "UpdateTokenInfos",
"4333969236270dde": "UpdateTokenInfoScopeChain",
"021ad70e125f1f8d": "UpdateTokenInfoScopeTwap",
"19b3189264543abf": "UpdateTokenInfoTwapDivergence",
"d504449cfe171027": "UpdateTokenInfoTwapMaxAge",
"c52f96b2327bfba4": "UpdateTokenInfoUpperHeuristic",
"f3600a3d00d5739c": "UpdateTokenMetadataMode",
"a1b9723c40cc15db": "UpdateTokenRatios",
"314eb95056367945": "UpdateTooFrequent",
"4534dc5aadb99ec8": "UpdateTooSoon",
"0e7d2cb9c028a7de": "UpdateTreasuryPct",
"9dbc3ab0b9e5cfaf": "UpdateTwap",
"cf45bf94c485da65": "UpdateTwapMaxAge",
"e78d0e1028edaf35": "UpdateTxnFeeCost",
"d77678fd0bbf6561": "UpdateUnstakeLockDuration",
"d3be37e07d001b9c": "UpdateVaultId",
"7e848f8aafd9bde2": "UpdateWindowIsTooLow",
"c9793bb424a2aa10": "UpdateWithdrawalCapACapacity",
"e4afe7694e830c0b": "UpdateWithdrawalCapACurrentTotal",
"ab6a4f7fa75759d3": "UpdateWithdrawalCapAInterval",
"32e2a21232ec7cc1": "UpdateWithdrawalCapBCapacity",
"7a5dd2b8b0458bc7": "UpdateWithdrawalCapBCurrentTotal",
"d6ec938802a51420": "UpdateWithdrawalCapBInterval",
"2392f4aa523b4b07": "UpdateWithdrawBlocked",
"fcf126b76d51cfc8": "UpdateWithdrawFee",
"0f99da8d9bd96abd": "Upgrade",
"290a73a9fadf36bc": "UPGRADE_SEED_PREFIX",
"a916c8fe0bb59629": "UpgradeAuthorityNotFound",
"099c76903884f4cb": "UpgradeContract",
"53e8d9e4a3a4f84d": "Upkeep",
"9cdd4a526cb5a615": "UpkeepResourceType",
"a26174e8d6e3fe77": "UpperboundExceeded",
"e56547e03035f4c1": "UpperHeuristic",
"0a9931185b5ed12e": "UpperTickNotMultipleOfTickSpacing",
"a979271475544951": "UpperTickTooLarge",
"2191b85e2ce0ed6f": "URIPrefixTooLong",
"70a8e23eb70ed401": "UriTooLong",
"c5ef5723faa91283": "URITooLong",
"efcb8e7ac85acca7": "UrlTooLong",
"2eca99be890c2977": "USDC",
"9960507f0505d275": "USDC_EMA",
"bae9c930649b4256": "UsdcIsntEnough",
"44d5c9eb6e585458": "UsdcRewardVault",
"2027e4537ab0de1f": "USDH",
"a1ba8907ff1d5113": "USDH_TWAP",
"0f61bd28971fb227": "UsdhWithdrawalCap",
"a01541b5de424685": "UsdPerTokenUpdated",
"61a76cd9b7767c53": "UsdPerUnitGasUpdated",
"374a04a6097a30e1": "USDR",
"9f0489d545b9c8c9": "USDR_TWAP",
"7efbf16885607d97": "USDT",
"a01691e81278bb3a": "USDT_EMA",
"833468c34a084fe3": "Used",
"d4de9dfc8247b3ee": "UsedNonce",
"3c7012488ab5648a": "UsedNonces",
"2f313520a5b7c51b": "UseMethod",
"9f755fe3ef973aec": "User",
"1f8b6a5f4d7e64ea": "USER_FUND_ACCOUNT_CURRENT_SIZE",
"00a42cc34ae46b6a": "USER_FUND_ACCOUNT_CURRENT_VERSION",
"c301373f2ed529c9": "USER_REWARD_ACCOUNT_CURRENT_SIZE",
"1598b6a91f88956e": "USER_REWARD_ACCOUNT_CURRENT_VERSION",
"d3218810ba6ef27f": "UserAccount",
"f74f15905bcace68": "UserAccountDisable",
"be7b74dccb1a87df": "UserAccountHasBeenInitialized",
"d22ac24ea98ed71c": "UserAtaFarmTokenMintMissmatch",
"f142201e68f90113": "UserAtaRewardVaultMintMissmatch",
"d5ff03d1f68bc7e7": "UserBankrupt",
"3943bf30b51de396": "UserBorrowMax",
"1b9d7f594b45af8b": "UserBorrowMin",
"27c12c1d81dc0d5c": "UserBurnLogger",
"7fb6fac58c326570": "UserCanceledWithdrawalRequestFromFund",
"4199fa818ba85fbb": "UserCantBeDeleted",
"1c816361523ebeac": "UserCantLiquidateThemself",
"29b1dadfc4b08841": "UserCantReferThemselves",
"357e86c087f97b0d": "UserCheckInState",
"2de8c00ab308a7e0": "UserClaimedReward",
"ea181e3dffb28747": "UserClaimPortion",
"69120ac213acac53": "UserCollateralAmounts",
"97854df9f17ef8d2": "UserCommitNotInit",
"43033c15ecf0c0db": "UserCreatedOrUpdatedFundAccount",
"e9d67daffd2d44df": "UserCreatedOrUpdatedRewardAccount",
"3e26a5fe62d3593c": "UserCronJobsV0",
"f97419715779aa33": "UserDebtMax",
"626f304ad2e7aacc": "UserDebtMin",
"4a67e211a6475a3f": "UserDebtTooHigh",
"cf1f3a0bae5c43e2": "UserDebtTooLow",
"a5617f2692c580ce": "UserDelegatedFarmNonDelegatedMissmatch",
"717d6e28e021fda6": "UserDelegatedRewardAccount",
"d03e63a4ade69290": "UserDepositedToFund",
"170f94e582ed8310": "UserDepositTooHigh",
"18934981e0263ac0": "UserExtraCollateralOutOfCapacity",
"70d6669898685ba0": "UserFees",
"6d4e9db2e09e5ab5": "UserFlagContainer",
"d0a62ff1b34c9dd4": "UserFundAccount",
"760ba6180a3abdff": "UserGtState",
"99e58cb409a6f3d9": "UserHasInvalidBorrow",
"17a6186fd914cd55": "UserHasNoOrder",
"a8446c88cdd1f5b4": "UserHasNoPositionInMarket",
"0c4ed3f4e14dd1f9": "UserHeader",
"62d753b910fcdbc2": "UserIndexAccount",
"831d32d5c4787093": "UserIndexAccountDisable",
"daa4aa939f650056": "UserInfoBelongsToAnotherUser",
"b52ecf91aed6be4f": "UserIsBeingLiquidated",
"be64a6ecaa2e7d80": "UserIsLiquidated",
"80002554f966f4eb": "UserLimitNeedsNotary",
"d7e117f8f23a49fa": "UserLockLogger",
"9dd6dceb6287ab1c": "UserMetadata",
"2c6342da03cff23d": "UserMustSettleTheirOwnPositiveUnsettledPNL",
"13777004d7b94361": "UserNicknameInvalidFormat",
"3afe217c7d045cd5": "UserNicknameTooLong",
"1690c6a4cc4aaf8b": "UserNicknameTooShort",
"e4254b1d682e8f4e": "UserNotBankrupt",
"b079e225cd44dd19": "UserNotFound",
"f2c816c4b0c04687": "UserNotInactive",
"50818f8468b2da99": "UserOrderId",
"25ec06153219f954": "UserPointsAccount",
"008d591dec060e0f": "UserPoolLiquidity",
"202577cdb3b40dc2": "UserProfile",
"ada9fe3df77dc82a": "UserProfileV1",
"f5f3c51b0dad98e3": "UserProfileVersion",
"40a650064e968ff9": "UserRedemption",
"02b98d61f04ab413": "UserReduceOnly",
"d5fba12c995183a6": "UserRequestedWithdrawalFromFund",
"37f57aee9359a4c6": "UserRewardAccount",
"6e39fb8bfaecd5b2": "UserRewardInfo",
"fcdbc0ce80c92583": "UserRewardPool",
"cf20744e0cbf27d1": "UserRewardSettlement",
"6635a36b098a5799": "UserStake",
"b5defc02823a1ede": "UserStakeNotFound",
"2253ca5d19f33f36": "UserStaking",
"e5eaf1e0c40d1b03": "UserStakingState",
"48b155f94ca7ba7e": "UserState",
"b0df881b7a4f20e3": "UserStats",
"d54c9c546db60c74": "UserStatsNotFound",
"493daf056d3da378": "UserStatsWrongMutability",
"c803748c2a234d02": "UserStatus",
"7a7c6380de3f95e3": "UserStatusNotActive",
"1ce15f1db01d7b86": "UserSwapBalanceDiffs",
"8ce4983ee71bf5c6": "UserSwapBalancesState",
"17707b2de260fbf8": "UserTokenAccountNotParsingFromRemaining",
"d4d5c3c4f2dd4624": "UserTransferredReceiptToken",
"993858f8e3763937": "UserUnwrappedReceiptToken",
"4fdc85319a1c77b0": "UserUpdatedRewardPool",
"903aad92a62d3119": "UserWellCollateralized",
"db47e844c82e7a33": "UserWithdrewFromFund",
"456a1fcf621b0b02": "UserWrappedReceiptToken",
"47c02b1947c2c04b": "UserWrongMutability",
"43cee1f6bcec2c75": "Uses",
"b499dcec6be7d7b6": "USH",
"286e39368fd9b4a9": "USH_TWAP",
"9f4405cd3065949f": "Ustur",
"90f37071f0fd3304": "UTF8",
"98cb0e88810ec006": "UTF8DecodingException",
"51a52a4b7a21c35a": "UuidMustBeExactly6Length",
"50051a38a4f72260": "UXD",
"733c8eb1cfd8d3a3": "UXD_TWAP",
"f90a28c0b0dd8e41": "UXP",
"e6c6a9e59f47395b": "V0",
"30a9fb9452bf7098": "V1",
"1fbf357be8ee4875": "V2",
"c8578458ebaa4449": "VaaNotProvided",
"25af21da6608d9d4": "VaaStillProcessing",
"a6ed0c92884639b9": "Valid",
"82f19771a9c3db94": "Validation",
"539942ce9841936d": "ValidationFailed",
"faefcc9091b930b1": "ValidatorBelowLivenessMinimum",
"dfcb2722bdc54c0b": "ValidatorBelowStakeMinimum",
"cd1908ddfd830292": "ValidatorHistory",
"178e25f513e3a1b6": "ValidatorHistoryEntry",
"2e926964f15a3347": "ValidatorIndexOutOfBounds",
"83b57d7f2e2428a7": "ValidatorList",
"dae255aff6c575e7": "ValidatorMarkedActive",
"aff0d1fc43d8de43": "ValidatorNeedsToBeMarkedForRemoval",
"2efc377b9862b61c": "ValidatorNotInList",
"9c7b041537b7408d": "ValidatorNotMarkedForRemoval",
"ccf154d58a78052d": "ValidatorNotRemovable",
"69f8702247e01547": "ValidatorRecord",
"627d6ddd14521c38": "ValidatorsHaveNotBeenRemoved",
"c8150a1e91deaed6": "ValidatorsNeedToBeRemoved",
"bf8309b60f727757": "ValidatorSystem",
"584e50c4bccecf99": "ValidityGuardRails",
"1d6b38fce6ff3383": "ValuationSummary",
"06ed61828d3b53d4": "ValueIsZero",
"351b602a6efe2087": "ValueRef",
"09b66073d4ec0b76": "ValueType",
"d6ec57c7d7f33bb3": "Vanilla",
"c17436507607df26": "VariableLimit",
"316e6f7dfc92b5b1": "VariableLimitNotSupported",
"0f06179e41ec7a4e": "VariableParameters",
"d308e82b02987577": "Vault",
"10e13c74a15c689a": "VaultAccountDuplicated",
"18d7fcbbef1729ef": "VaultAccountNotProvided",
"880097b5d5c02da7": "VaultAllocation",
"26d506215e7768b5": "VaultAsset",
"f12ba859ce815f86": "VaultAUMZero",
"8422bbcacac3d335": "VaultAuthority",
"9a189fe299293214": "VaultBalancesCausesWrongSharesIssuance",
"c4792e240c13fc07": "VaultBatchTransaction",
"0e82845cdd61152c": "VaultBumps",
"9c21e497d18689bd": "VaultConfigField",
"dbc32cb3f5b2ad18": "VaultConfiguration",
"c971509ab4ecc647": "VaultCreated",
"82d465f792b59564": "VaultData",
"2726f19716e1356b": "VaultDeposited",
"576db66a57603fd3": "VaultDepositor",
"a7318bb3409d22a5": "VaultDepositorAction",
"fe9367a432c971de": "VaultDepositorRecord",
"85faa14ef61b37bb": "VaultInfo",
"cb8bca961f2d5e0e": "VaultInitializationInput",
"0602fa9fc562b486": "VaultInLiquidation",
"6a8f8fbd59cad8c5": "VaultIsAtCapacity",
"83b0bedab93aeba0": "VaultIsDisabled",
"b6f0256cce6ee12b": "VaultIsPaused",
"17c4581228bf774d": "VaultLp",
"9a6dd1d23b23a1f1": "VaultModeIsIncorrect",
"cc38fcab36942e7c": "VaultNftTokenAccountNotParsingFromRemaining",
"2459ee8ebf194ade": "VaultNotActive",
"31f7cb80276a0cac": "VaultNotInitialized",
"2f01da7452467c77": "VaultRecord",
"60a9a3b680c1db4b": "Vaults",
"2d6dbfd115e62e3a": "VaultsMaxNumberExceeded",
"9299ec52533415dd": "VaultsMinNumberNotReached",
"e4c452a562d2eb98": "VaultState",
"f3a15732cea51a5e": "VaultTokenNonZero",
"a8faa264510ea2cf": "VaultTransaction",
"92bddcbb247ce0b4": "VaultTransactionMessage",
"5e39e42b239806fa": "VaultUpdatedData",
"4dbbd37f66849e6e": "VaultWithdrawAmountMustBeGreaterThanZero",
"c129b21b064621e3": "VaultWithdrawAmountTooHigh",
"1a8e74e2822d0c16": "VaultWithdrawn",
"c4c9ab0487c6a0f1": "VaultWithdrawRequestInProgress",
"617ccfb05ac5b288": "Verifiable",
"77d7fc8ed57d1e21": "VerifiableButCapExceeded",
"c67527008eada0a6": "VerificationLevel",
"50663ec6a093f4e3": "VerificationState",
"0044b498bbbe1fec": "Verified",
"994d5e35aec4be1f": "VerifiedButNotExecutable",
"f8b81f1a3aad46aa": "VerifiedCreators",
"f6f965a9fd2ad38c": "VerifiedCreatorsSignature",
"1d99e4e3bf58fb6c": "VerifiedHealthy",
"676dd4f548ab607c": "VerifiedMessage",
"ce792257006ceb93": "VerifiedUnhealthy",
"5178f8576bae3a9d": "VerifierAccount",
"104916dd181a4b79": "VerifierAccountConfig",
"8adb4544f9d98e23": "VERIFY_SEED",
"2a2e5451e34d611c": "VerifyAdminChange",
"142b3e9b4902b78f": "Verifying",
"e722474df87524f6": "VerifySignatures",
"ea04fe2af2c488c7": "Version",
"9e407b20b3ac54b8": "VertigoBuy",
"8721a3f364f439ae": "VertigoSell",
"2dcc5f3896e961e7": "Vest",
"6495428a5fc880f1": "Vesting",
"e0464e8078c709b6": "VestingBalance",
"008a47871a1d2b7d": "VestingConfig",
"fb369579435eaf53": "VestingDurationIsInValid",
"3e268882ccc2482c": "VestingEnd",
"f477b704497487c3": "VestingEscrow",
"18cca668579e4c0d": "VestingEscrowMetadata",
"26d6c9c5bca25a52": "VestingFinalized",
"5ab05610ee0739ef": "VestingInfo",
"6c1e6173e8817ade": "VestingNotStarted",
"43a51c10ca5d014e": "VestingParameters",
"3e3d13a1fbb3686b": "VestingPool",
"333e379de88dfd0d": "VestingPosition",
"d6009071feb33c10": "VestingPositionUpdatedData",
"051503fd4c1a9f21": "VestingRatioTooHigh",
"6af3ddcde67e5553": "VestingRecord",
"82c8ad94274bf393": "VestingSchedule",
"43f51af335950f12": "VestingSettingEnded",
"1c69dbe7aea2aef2": "VestingStrategy",
"ee9121632f845f48": "VestingUnfinalized",
"3969609e319a0a1d": "VestRegistry",
"b658c711f69a88f8": "VestV1",
"fb48fc594e75657a": "VestVersion",
"5509c01582354269": "ViolateMaxOut",
"7931973eb0e0d9de": "ViolateMinOut",
"0445b93882b3b14b": "Virtual",
"d5e005d16245775c": "VirtualPool",
"d92552fa2b2fe4fe": "VirtualPoolMetadata",
"2bce1c2541a66a96": "Virtuals",
"0c2de73c880ddbd3": "VirtualsBuy",
"477605cb05628774": "VirtualsPool",
"e312709b22ac6399": "VirtualsSell",
"709987df35f78165": "VirtualStablePair",
"b31f2aee738c0ea7": "VirtualVault",
"1acf42fb280c0fd0": "VOC",
"8f8b975136d87a00": "Voided",
"a3cb548cced9dde2": "VoidMarketInvalidStatus",
"8ee6de0f7c6ad91e": "VoidMarketMatchingQueueNotProvided",
"873d942c096168ef": "VoidMarketNotInitializingOrOpen",
"19b533cd15523e63": "VoidMarketNotReadyForVoid",
"6c3d436c12f8c364": "VoidMarketRequestQueueNotProvided",
"480b71ff7c1d84e7": "VoidOrderIsVoided",
"e069a15d58f63aa9": "VoidPaymentCalculation",
"33a4cf2cb2f9203a": "Volatile",
"f47367eac9520817": "VolatilityTracker",
"25472a41e1ef797a": "Volcanic",
"f3ff55f86e8abb93": "VoltageMultiplier",
"0e7c5a796085339d": "VoltagePointsLog",
"8691acd4fbfa82fa": "VoltagePointsType",
"b6611e22f9c74f6a": "VoltageStats",
"ee8a31e79b1cca0c": "VolumeStats",
"605b68399123ac9b": "Vote",
"ce227b4e953ddb9f": "VoteCast",
"4d6892484b2bfa5b": "VoteDuringTransferEpoch",
"055404fb19c8b9e4": "VoteHistoryNotRecentEnough",
"53cd3bd790ea2b46": "VoteMarkerV0",
"f15d23bffe9311ca": "Voter",
"70097ba5ea099da7": "VoteRecord",
"5fbc867484d4945e": "VoterInfo",
"3f02f63fa31274f1": "VoterWeightAction",
"2ef99b4b99f87409": "VoterWeightRecord",
"b0495dbef56e28d8": "VoteWeightWindowLengths",
"456495f5c753023c": "Voting",
"f697b5fd5030e6f3": "VotingMintConfig",
"f703bea91b64facb": "VotingMintConfiguredWithDifferentIndex",
"eda4de5268a47186": "VotingMintConfigV0",
"35585d73772de770": "VotingMintNotFound",
"8cace3438eb03206": "VotingTokenNonZero",
"bfcc95ead5a50d41": "Voucher",
"063897c14cde1db4": "VOUCHER",
"d45526dd8634e5e3": "WagerTooSmall",
"d584dd8156031a46": "Wait",
"e11df94d971e0d9e": "WaitingForBorrower",
"4118f4a6be606e05": "WaitingForLender",
"992ea0b6f9f5d98e": "WaitingPeriod",
"cfd867306a025420": "WalletExists",
"b46dd506a473c144": "WalletLimitExceeded",
"2efa058f277b6873": "WalletLimitInfo",
"6d27affca50bd2fb": "WalletLimitInfoPerStage",
"b1d8edae0f99ba39": "WalletLimitSpecification",
"49f33c9138f0be30": "WalletSeeds",
"2afe29ae662ca9c1": "WalletUniquenessEnforced",
"5ae95d58213d05aa": "Wallpaper",
"86b5231396663b69": "WallpaperNotUnlocked",
"508385472dd365b1": "Warp",
"e3424e1a499fd1eb": "WarpIsOnCooldown",
"93fd69de965457d1": "WarpLane",
"75ad832bc379feec": "WarpLaneInput",
"5128b81953a7571f": "WarpToCoordinateInput",
"10d0321531e0defb": "WayruHotspot",
"a21e79a5df8babb2": "Web",
"bd1f54fb01d3b99b": "Week",
"fec7f815792867cb": "Weekly",
"345667b3a3799c00": "WeightInsuffient",
"c4290b2f7bb40adb": "Wheel",
"3f95d10ce1806309": "Whirlpool",
"82b45b77fe48e1c4": "WhirlpoolBumps",
"8d5b6d2b1c2af3a3": "WhirlpoolOracle",
"ea454dbc95d633ba": "WhirlpoolRewardInfo",
"9d1431e0d957c1fe": "WhirlpoolsConfig",
"0263d7a3f01a993a": "WhirlpoolsConfigExtension",
"ff12ddf6f72dadae": "WhirlpoolsSwap",
"a626d62a248481b5": "WhirlpoolsSwapOptions",
"beb2e7b831ba670d": "WhirlpoolStrategy",
"53fcfc7f5a98e30c": "WhirlpoolSwapV2",
"5f388ffd784d7ce5": "WhirlpoolV2",
"b047e961b48466ea": "WhiteDwarf",
"ccb0344f927936f7": "Whitelist",
"c4084968d5c9c3c3": "WHITELIST_SEED",
"24adb0b9474277b1": "WHITELIST_SIZE",
"cf37cbad5410533d": "WHITELIST_V2_BASE_SIZE",
"427bfb1141228f3f": "WHITELIST_V2_CONDITIONS_LENGTH",
"6883dd77df010112": "WhitelistedMint",
"0d6ba2cc5e928f98": "WhiteListHasValueInLocation",
"0b55630eab160236": "WhitelistIsFrozen",
"3c6b80d6aa52ab27": "WhitelistNotVerified",
"ba81c0d4a6153a59": "WhitelistTokenNotFound",
"285c65e2a6b2b921": "WhitelistType",
"88b82dbf55cbbf77": "WhitelistV2",
"88c854e3b2ffaf7e": "WifiDataOnly",
"c8a770b8e584ac53": "WifiIndoor",
"e7209333ebbb1def": "WifiInfoV0",
"354b0c212a58067b": "WifiOutdoor",
"91cfcc8c3602259d": "Win",
"c79d63eab1ad36b9": "WindowedCircuitBreakerConfigV0",
"76a880f4d390ba31": "WindowV0",
"1f570653397179f0": "WinnerIsPrivilegedYet",
"fa0ede24df3e4bf8": "Withdraw",
"db9f70d93cdf9c27": "WITHDRAW",
"4ea4ab418cde3149": "WITHDRAW_REQUEST_SEED",
"0a2dd3b681eb5a52": "Withdrawal",
"8d4a60e9fba8e77e": "WithdrawalBatch",
"0f986589682bf206": "WithdrawalCapAccumulatorAction",
"5afd8ff2d1c33ad1": "WithdrawalCapReached",
"3b8deceda7579545": "WithdrawalCaps",
"8d8e00a6f52ef7b3": "WithdrawalCreated",
"b81cce001e380edd": "WithdrawalExecuted",
"3a2f6d3f4261b86a": "WithdrawalFeeBps",
"4e60f5dd75fd9b8c": "WithdrawalNotYetAvailable",
"03fa4d808d1192a5": "WithdrawalRemoved",
"f25893adb63ee5c1": "WithdrawalRequest",
"faa7c0b399e7a64a": "WithdrawalTokenAccounts",
"615aa5fc5da983fd": "WithdrawAmountBelowMinimum",
"279117567108c1bc": "WithdrawAmountIsTooLow",
"d4693ff9e63e2a1e": "WithdrawAmountIsZero",
"d99468c50fa8ee10": "WithdrawAndFreeze",
"825ba4825ce4b542": "WithdrawApproval",
"10a517b2945a6b67": "WithdrawAuthority",
"f9c979c2ae03b728": "WithdrawCargoFromFleetInput",
"bce4ba9bd3d6afa5": "WithdrawCollateralBlocked",
"ff6bfa6cb5dd710a": "WithdrawCooldownPeriod",
"1e23a7ada4ac74e1": "WithdrawDisabled",
"0bdeab4869e285f3": "WithdrawExceedsMarginLimits",
"4dee2c0176d34a51": "WithdrawExecuted",
"943ea01146f1edda": "WithdrawFailed",
"20198c90efee39ed": "WithdrawFees",
"0e220ef5f9b06dda": "WithdrawIneligibleReward",
"b4b49ea370b6f313": "WithdrawingOnlyAtLeastOneBuyAndOneSellPairs",
"c2f22a2a5c1a752e": "WithdrawingOnlyBuyOrdersPairs",
"fb04f02656146701": "WithdrawingOnlySellOrdersPairs",
"1b082b980a20b73a": "WithdrawInitiated",
"f908cd6b25039ef1": "WithdrawInProgress",
"52084002b8100a1a": "WithdrawInstantFees",
"5dd6330970855406": "WithdrawInvalidated",
"7edfa9de3f949bb1": "Withdrawn",
"c0d4de1b234230b4": "WithdrawnTokenized",
"bf2a1a90f3899685": "WithdrawnVirtual",
"99fe2249aac5f2c1": "WithdrawOnCooldown",
"480060ca96b17b05": "WithdrawOnly",
"0b2222ee057d2b7e": "WithdrawPaused",
"d2b061dba2af9a66": "WithdrawProof",
"8dcf5d13a5b61f5d": "WithdrawProtocolFees",
"a92cbdd01b325968": "WithdrawReport",
"baefaebfbd0d2fc4": "WithdrawRequest",
"58367d5bc2891857": "WithdrawRequestAmountTooSmall",
"5b8367bb973a575a": "WithdrawRequestExceedsUserBalance",
"da7362477fa7edd5": "WithdrawRequestNotReady",
"2fee6fb1e2414872": "WithdrawResultsInZeroShares",
"93317b8e55715152": "WithdrawRewardZeroAvailable",
"b7af78327d9e839e": "WithdrawSolFees",
"d44a4e48b345f855": "WithdrawStabilityBlocked",
"a95d71d61426cf56": "WithdrawStakeAccountFeeIsTooHigh",
"74c735a08ea1e6bb": "WithdrawStakeAccountIsNotEnabled",
"3dee59e5cbb05fbe": "WithdrawStakeItem",
"53bbd4e9ac27ca47": "WithdrawStakeLamportsIsTooLow",
"9f541a3c5eda5545": "WithdrawStakeLog",
"bb8c2113ae937369": "WithdrawStatusUpdated",
"21f619004b610ffe": "WithdrawSucceed",
"a36c6ffe34d66adc": "WithdrawTokenApproval",
"fece764021e77a4a": "WithdrawTokenLog",
"dbcdd7e6f5b57c10": "WithdrawUnit",
"d5f6de3930184470": "WithdrawWaitingPeriodNotPassed",
"ece7fb0b075dbc51": "WithExpiry",
"4274bcf0f80dc244": "Won",
"346eef2d855ec3b4": "WooAmmPool",
"e8019533a06f87b0": "WooConfig",
"1de74a26ae1e23bf": "Woofi",
"386a39312b458895": "WooOracleBoundLimit",
"06c67076f57bfc27": "WooOracleNotFeasible",
"0b82e3b71fd2e9a1": "WooOraclePriceNotValid",
"7ca30364ab8eca00": "WooOraclePriceRangeMax",
"2ce7f616fb98df7a": "WooOraclePriceRangeMin",
"6c70a9fd3ee166c7": "WooOracleSpreadExceed",
"b34d3dd927550de3": "WooPool",
"7cbc916a755ec940": "WooPoolExceedMaxGamma",
"d7c1f0a66ea85292": "WooPoolExceedMaxNotionalValue",
"82d5e0037e3a7e49": "Wooracle",
"e09e6105e0f14392": "Worker",
"3fc76eda41e850f6": "WorkerCommission",
"35266af771aeda02": "WorkerFee",
"2c4c0a2868040e00": "WorkerSettings",
"40310ad8cd3a88e0": "Wormhole",
"90efd5302376e69c": "WormholeAddresses",
"0a9fc282ba19fecf": "WormholeChainMetadata",
"b25b5c9815d209f4": "WormholeConfig",
"225fa184e2e11f0b": "WormholeEmitter",
"a90856e023e9e7ee": "WormholeForeignEmitter",
"0a3a57b70696e9af": "WormholeGuardianSet",
"92e0ed29d326107b": "WorseHealthPostLiquidation",
"0cc8de8b892f3c15": "WorseLtvBlocked",
"b7544afe58e61d08": "WorseLTVBlocked",
"7f719324bd3c4be2": "WorseLtvThanUnhealthyLtv",
"abb84c37686bc014": "WouldSelfTrade",
"40748587651e1dc5": "WrappedI80F48",
"f7a5b6c62782a4b3": "WrappedRecipeCategory",
"86bc5ae6b1fcfbb4": "WrappedShipEscrow",
"1c29c6a3bd95af8e": "WrappedToken",
"3f2a0d5cd3eace45": "WrappedTokenHolder",
"42417e582579e8e1": "Writeable",
"6d406df01286a221": "WriteAccessCheckFailed",
"5d03a59e4d57738e": "Writing",
"2ca42047e7495f77": "WSol",
"764211ba2f69e71d": "WSTETH",
"9e3e1ce98622dbc0": "XChainPoolAuthorization",
"dfde2ba2599e6f02": "XChainPoolNotAuthorized",
"8a3e98e1a4aa5efc": "XSmall",
"c48694c58a610b96": "XxSmall",
"d05c2f93a330b131": "XYK",
"9e0ec2b78453df1c": "YouHaveNoPendingRewards",
"fd6974ad1c99a2bb": "Zero",
"69da42085256695e": "ZeroAddress",
"09b0f1fc3007c016": "ZeroAmount",
"ab04a3f749ae6e7d": "ZeroAmountInvalid",
"578a5a338bdb22e3": "ZeroAmountProvided",
"1f513f65286cb2ae": "ZeroAmountSpecified",
"0155a030b2c9b2bf": "ZeroAuthority",
"d647691895a2d75f": "ZeroCreditChunkSize",
"121a76866ace3e9c": "ZeroEpochDuration",
"89fa0385fdc6345f": "ZeroFeeReceiver",
"36884c9c05646ffa": "Zerofi",
"bfa4e6fd2aba0c98": "ZeroFi",
"825c58eb133a30c8": "ZeroFundedAmount",
"9a8164dfae78dabe": "ZeroGasLimit",
"825c1832480564f2": "ZeroGuardians",
"dc84916e5aaf173e": "ZeroLiquidationAmount",
"cbdc087f2b75485d": "ZeroLiquidity",
"ef1dac7f98548c6e": "ZeroLiquidityRemove",
"a097c52874e48645": "ZeroLiquidityToAdd",
"9be548b040acb2bc": "ZeroLzComposeGasProvided",
"c445995ffbfebbb7": "ZeroLzReceiveGasProvided",
"e63c9c85e7e79193": "ZeroMaxLtvAssetsInDeposits",
"3e04d464555eabf8": "ZeroMessageSize",
"f72cf5f3e86d6620": "ZeroMinimumSignatures",
"7e479425ccfcb7c5": "ZeroMinLpTokens",
"ad79d72fdbe7ab63": "ZeroMintAmount",
"d38fd43a51ab2125": "ZeroPrice",
"73f032cc068b8e5e": "ZeroPriceRange",
"28e462c834b39a60": "ZeroPsol",
"919d13006b40e802": "ZeroRewardRate",
"7202d8530d4c6773": "ZeroSharesMinted",
"228c98ea57b490a4": "ZeroShipsAdded",
"0457c788b85cf37d": "ZeroSwapAmount",
"82fa28bbcd45aa7d": "ZeroThreshold",
"add9acbaaf751b62": "ZeroTradableAmount",
"9542cdd23409cf93": "ZeroTradingTokens",
"2aab59fad520da33": "ZeroValidatorChunkSize",
"e8950cb002b95ba3": "ZeroYield",
            },
    "constants": {
        "0100000000000000": "u64: 1 (little endian)",
        "0a00000000000000": "u64: 10 (little endian)",
        "6400000000000000": "u64: 100 (little endian)",
        "e803000000000000": "u64: 1000 (little endian)",
        "00e1f50500000000": "u64: 100000000 (1 SOL in lamports)",
        "00ca9a3b00000000": "u64: 1000000000 (little endian)",
        "ffffffffffffffff": "u64: MAX_VALUE",
    }
};

this.initializeEventListeners();
this.initializeToastContainer();
this.initializeSettingsModal();
this.checkFirstTimeSetup();
}

initializeEventListeners() {
    document.getElementById('processBtn').addEventListener('click', () => {
        this.processHexInput();
    });

    document.getElementById('hexInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default textarea behavior
            this.processHexInput();
        }
    });
    
    // Smart search event listeners
    const smartSearch = document.getElementById('smartSearch');
    const clearSearch = document.getElementById('clearSearch');
    
    smartSearch.addEventListener('input', (e) => {
        this.handleSearchInput(e.target.value);
    });
    
    smartSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.navigateToNextMatch();
        } else if (e.key === 'Escape') {
            this.clearSearch();
            smartSearch.blur();
        }
    });
    
    clearSearch.addEventListener('click', () => {
        this.clearSearch();
    });
}

initializeToastContainer() {
    this.toastContainer = document.createElement('div');
    this.toastContainer.id = 'toast-container';
    this.toastContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(this.toastContainer);
}

showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `p-3 rounded-lg text-white font-medium shadow-lg transform transition-all duration-300 translate-x-full opacity-0`;

    switch (type) {
        case 'success':
            toast.classList.add('bg-green-500');
            break;
        case 'error':
            toast.classList.add('bg-red-500');
            break;
        case 'warning':
            toast.classList.add('bg-yellow-500');
            break;
        default:
            toast.classList.add('bg-blue-500');
    }

    toast.textContent = message;
    this.toastContainer.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    }, 10);

    // Auto-remove toast
    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

clearAllLists() {
    // Clear all data structures
    this.suggestions = [];
    this.acceptedDecodings = [];
    this.stagedBytes = [];
    this.isAccountData = false;
    this.currentAccountInfo = null;

    // Clear UI elements
    document.getElementById('acceptedList').innerHTML = '<p class="text-gray-500 text-sm">No accepted decodings yet</p>';
    document.getElementById('suggestionsList').innerHTML = '<p class="text-gray-500 text-sm">Enter hex data to see smart suggestions</p>';
    document.getElementById('selectionDecodeList').innerHTML = '<p class="text-gray-500 text-sm">Select bytes to see interpretations</p>';

    // Remove account info box if it exists
    const existingAccountBox = document.getElementById('account-info-box');
    if (existingAccountBox) {
        existingAccountBox.remove();
    }
}

clearAllLists() {
    // Clear all data structures
    this.suggestions = [];
    this.acceptedDecodings = [];
    this.stagedBytes = [];
    this.isAccountData = false;
    this.currentAccountInfo = null;
    
    // Clear search state
    this.searchMatches = [];
    this.currentMatchIndex = -1;
    this.clearSearchHighlights();
    document.getElementById('smartSearch').value = '';
    
    // Clear UI elements
    document.getElementById('acceptedList').innerHTML = '<p class="text-gray-500 text-sm">No accepted decodings yet</p>';
    document.getElementById('suggestionsList').innerHTML = '<p class="text-gray-500 text-sm">Enter hex data to see smart suggestions</p>';
    document.getElementById('selectionDecodeList').innerHTML = '<p class="text-gray-500 text-sm">Select bytes to see interpretations</p>';
    
    // Remove account info box if it exists
    const existingAccountBox = document.getElementById('account-info-box');
    if (existingAccountBox) {
        existingAccountBox.remove();
    }
}

clearAccountCache() {
    this.accountCache.clear();
    this.showToast('Account cache cleared', 'success', 2000);
    console.log('Account cache cleared');
}

handleSearchInput(value) {
    // Debounce search input
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
        this.performSearch(value);
    }, 300);
}

parseSearchInput(input) {
    const trimmed = input.trim();
    if (!trimmed) return null;
    
    // Offset lookup (@32)
    if (trimmed.startsWith('@')) {
        const offset = parseInt(trimmed.substring(1));
        if (!isNaN(offset)) {
            return { type: 'offset', value: offset };
        }
    }
    
    // Decimal number (1234) - check this BEFORE hex to avoid conflicts
    if (/^\d+$/.test(trimmed)) {
        const num = parseInt(trimmed);
        return { type: 'decimal', value: num };
    }
    
    // Hex sequence (0x1234 or abcd) - now requires 0x prefix OR non-decimal hex chars
    if (trimmed.toLowerCase().startsWith('0x')) {
        const hex = trimmed.substring(2).toLowerCase();
        if (/^[a-f0-9]+$/i.test(hex) && hex.length % 2 === 0) {
            return { type: 'hex', value: hex };
        }
    } else if (/^[a-f0-9]+$/i.test(trimmed) && /[a-f]/i.test(trimmed) && trimmed.length % 2 === 0) {
        // Hex without 0x prefix, but must contain at least one a-f character
        return { type: 'hex', value: trimmed.toLowerCase() };
    }
    
    // Solana pubkey (base58)
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) {
        try {
            // Convert base58 to hex
            const decoded = this.base58Decode(trimmed);
            if (decoded.length === 32) {
                const hex = Array.from(decoded).map(b => b.toString(16).padStart(2, '0')).join('');
                return { type: 'pubkey', value: hex, original: trimmed };
            }
        } catch (e) {
            // Invalid base58
        }
    }
    
    // String search
    return { type: 'string', value: trimmed };
}

performSearch(input) {
    this.clearSearchHighlights();
    this.searchMatches = [];
    this.currentMatchIndex = -1;
    
    const parsed = this.parseSearchInput(input);
    if (!parsed || this.rawData.length === 0) {
        this.updateSearchResults();
        return;
    }
    
    if (parsed.type === 'offset') {
        this.handleOffsetLookup(parsed.value);
    } else if (parsed.type === 'hex') {
        this.searchHexPattern(parsed.value);
    } else if (parsed.type === 'decimal') {
        this.searchDecimalAsIntegers(parsed.value);
    } else if (parsed.type === 'pubkey') {
        this.searchHexPattern(parsed.value);
    } else if (parsed.type === 'string') {
        this.searchStringPattern(parsed.value);
    }
    
    this.updateSearchResults();
    if (this.searchMatches.length > 0) {
        this.currentMatchIndex = 0;
        this.highlightCurrentMatch();
    }
}

handleOffsetLookup(offset) {
    if (offset >= 0 && offset < this.rawData.length) {
        this.searchMatches = [{ start: offset, end: offset + 1 }];
    }
}

searchHexPattern(hexPattern) {
    const pattern = hexPattern.toLowerCase();
    const patternBytes = [];
    
    for (let i = 0; i < pattern.length; i += 2) {
        patternBytes.push(parseInt(pattern.substring(i, i + 2), 16));
    }
    
    for (let i = 0; i <= this.rawData.length - patternBytes.length; i++) {
        let match = true;
        for (let j = 0; j < patternBytes.length; j++) {
            if (this.rawData[i + j] !== patternBytes[j]) {
                match = false;
                break;
            }
        }
        if (match) {
            this.searchMatches.push({ start: i, end: i + patternBytes.length });
        }
    }
}

searchDecimalAsIntegers(num) {
    // Build search list - include u8 for numbers < 256
    const searches = [];
    
    if (num < 256) {
        searches.push({ bytes: [num], name: 'u8' });
    }
    
    searches.push(
        { bytes: this.numberToLEBytes(num, 2), name: 'u16' },
        { bytes: this.numberToLEBytes(num, 4), name: 'u32' },
        { bytes: this.numberToLEBytes(num, 8), name: 'u64' }
    );
    
    console.log(`[SEARCH] Looking for decimal ${num} as:`);
    
    for (const search of searches) {
        if (search.bytes) {
            const hexStr = search.bytes.map(b => b.toString(16).padStart(2, '0')).join(' ');
            console.log(`  ${search.name}: [${hexStr}]`);
            
            for (let i = 0; i <= this.rawData.length - search.bytes.length; i++) {
                let match = true;
                for (let j = 0; j < search.bytes.length; j++) {
                    if (this.rawData[i + j] !== search.bytes[j]) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    console.log(`  Found ${search.name} match at offset ${i}`);
                    this.searchMatches.push({ 
                        start: i, 
                        end: i + search.bytes.length,
                        type: search.name
                    });
                }
            }
        } else {
            console.log(`  ${search.name}: too large for type`);
        }
    }
}

searchStringPattern(str) {
    const utf8Bytes = new TextEncoder().encode(str);
    
    for (let i = 0; i <= this.rawData.length - utf8Bytes.length; i++) {
        let match = true;
        for (let j = 0; j < utf8Bytes.length; j++) {
            if (this.rawData[i + j] !== utf8Bytes[j]) {
                match = false;
                break;
            }
        }
        if (match) {
            this.searchMatches.push({ start: i, end: i + utf8Bytes.length });
        }
    }
}

numberToLEBytes(num, byteCount) {
    if (num < 0) return null;
    
    // Use BigInt for larger numbers to avoid precision issues
    const bigNum = BigInt(num);
    const maxValue = BigInt(1) << BigInt(byteCount * 8);
    
    if (bigNum >= maxValue) return null;
    
    const bytes = [];
    for (let i = 0; i < byteCount; i++) {
        bytes.push(Number((bigNum >> BigInt(i * 8)) & BigInt(0xFF)));
    }
    return bytes;
}

base58Decode(str) {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const base = alphabet.length;
    
    let num = 0n;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const index = alphabet.indexOf(char);
        if (index === -1) throw new Error('Invalid base58 character');
        num = num * BigInt(base) + BigInt(index);
    }
    
    const bytes = [];
    while (num > 0n) {
        bytes.unshift(Number(num % 256n));
        num = num / 256n;
    }
    
    // Handle leading zeros
    for (let i = 0; i < str.length && str[i] === '1'; i++) {
        bytes.unshift(0);
    }
    
    return new Uint8Array(bytes);
}

bytesToAsciiString(bytes) {
    let result = '';
    for (const byte of bytes) {
        if (byte >= 32 && byte <= 126) {
            // Printable ASCII character
            result += String.fromCharCode(byte);
        } else if (byte === 0) {
            // Null terminator - show as \0
            result += '\\0';
        } else {
            // Non-printable character - show as hex
            result += `\\x${byte.toString(16).padStart(2, '0')}`;
        }
    }
    return `"${result}"`;
}

clearSearch() {
    document.getElementById('smartSearch').value = '';
    this.clearSearchHighlights();
    this.searchMatches = [];
    this.currentMatchIndex = -1;
    this.updateSearchResults();
}

clearSearchHighlights() {
    document.querySelectorAll('.search-highlight, .search-current').forEach(el => {
        el.classList.remove('search-highlight', 'search-current');
    });
}

highlightCurrentMatch() {
    this.clearSearchHighlights();
    
    for (let i = 0; i < this.searchMatches.length; i++) {
        const match = this.searchMatches[i];
        for (let j = match.start; j < match.end; j++) {
            const byteElement = document.querySelector(`[data-index="${j}"]`);
            if (byteElement) {
                if (i === this.currentMatchIndex) {
                    byteElement.classList.add('search-current');
                } else {
                    byteElement.classList.add('search-highlight');
                }
            }
        }
    }
    
    // Scroll to current match
    if (this.searchMatches.length > 0 && this.currentMatchIndex >= 0) {
        const match = this.searchMatches[this.currentMatchIndex];
        const byteElement = document.querySelector(`[data-index="${match.start}"]`);
        if (byteElement) {
            byteElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

navigateToNextMatch() {
    if (this.searchMatches.length === 0) return;
    
    this.currentMatchIndex = (this.currentMatchIndex + 1) % this.searchMatches.length;
    this.highlightCurrentMatch();
    this.updateSearchResults();
}

updateSearchResults() {
    const resultsElement = document.getElementById('searchResults');
    if (this.searchMatches.length === 0) {
        resultsElement.textContent = '';
    } else {
        resultsElement.textContent = `${this.currentMatchIndex + 1} of ${this.searchMatches.length}`;
    }
}

isSolanaAccountAddress(input) {
    // Check if input looks like a Solana account address
    // Must be valid base58 and decode to exactly 32 bytes
    if (!input || input.length < 32 || input.length > 44) {
        return false;
    }

    if (!this.isValidBase58(input)) {
        return false;
    }

    try {
        const decoded = this.base58Decode(input);
        return decoded.length === 32;
    } catch (error) {
        return false;
    }
}

async processSolanaAccountInput(accountAddress) {
    this.showToast(`Fetching account data for ${accountAddress.substring(0, 8)}...`, 'info', 3000);

    try {
        const result = await this.fetchSolanaAccountData(accountAddress);

        if (!result) {
            this.showToast('Account not found or has no data', 'error');
            return;
        }

        // Clear all previous data
        this.clearAllLists();

        // Set account data mode
        this.isAccountData = true;
        this.currentAccountInfo = {
            address: accountAddress,
            ...result.accountInfo,
            isPDA: await this.checkIfPDA(accountAddress)
        };

        // Convert account data to hex bytes
        this.rawData = result.accountData;
        this.byteStates = new Array(result.accountData.length).fill('undefined');
        this.stagedBytes = [];

        this.showToast(`Loaded ${result.accountData.length} bytes from account`, 'success');

        this.renderAccountInfoBox();
        this.renderHexdump();
        this.generateSuggestions();
        this.updateSelectionDecode();

    } catch (error) {
        console.error('Error fetching account data:', error);
        this.showToast('Failed to fetch account data', 'error');
    }
}

async fetchSolanaAccountData(accountAddress) {
    for (let i = 0; i < this.solanaRpcUrls.length; i++) {
        const rpcUrl = this.solanaRpcUrls[i];

        try {
            const requestBody = {
                jsonrpc: '2.0',
                id: 'fetch_account_data',
                method: 'getAccountInfo',
                params: [accountAddress, { encoding: 'base64' }]
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.rpcTimeout);

            const response = await fetch(rpcUrl, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                this.handleRpcError(response.status, 'fetchSolanaAccountData');
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            if (!data.result || !data.result.value) {
                return null; // Account not found
            }

            const accountInfo = data.result.value;

            if (!accountInfo.data || !accountInfo.data[0]) {
                return null; // No account data
            }

            // Decode base64 data to bytes
            const base64Data = accountInfo.data[0];
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            return {
                accountData: Array.from(bytes),
                accountInfo: {
                    owner: accountInfo.owner,
                    lamports: accountInfo.lamports,
                    executable: accountInfo.executable,
                    rentEpoch: accountInfo.rentEpoch
                }
            };

        } catch (error) {
            console.log(`Error with RPC ${rpcUrl}:`, error.message);
            if (i === this.solanaRpcUrls.length - 1) {
                throw error;
            }
        }
    }
}

checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const accountParam = urlParams.get('account');

    if (accountParam && this.isSolanaAccountAddress(accountParam)) {
        document.getElementById('hexInput').value = accountParam;
        // Process the account immediately since DOM is already ready
        this.processHexInput();
    }
}

base58Decode(str) {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const base = BigInt(58);

    let decoded = BigInt(0);
    let multi = BigInt(1);

    for (let i = str.length - 1; i >= 0; i--) {
        const char = str[i];
        const index = alphabet.indexOf(char);
        if (index === -1) {
            throw new Error(`Invalid base58 character: ${char}`);
        }
        decoded += BigInt(index) * multi;
        multi *= base;
    }

    // Convert to bytes
    const bytes = [];
    while (decoded > 0) {
        bytes.unshift(Number(decoded % BigInt(256)));
        decoded = decoded / BigInt(256);
    }

    // Handle leading zeros
    for (let i = 0; i < str.length && str[i] === '1'; i++) {
        bytes.unshift(0);
    }

    return bytes;
}

async processHexInput() {
    const input = document.getElementById('hexInput').value.trim();

    // Check if input is a Solana account address
    if (this.isSolanaAccountAddress(input)) {
        await this.processSolanaAccountInput(input);
        return;
    }

    const hexData = this.parseHexInput(input);

    if (hexData.length === 0) {
        alert('Please enter valid hex data or Solana account address');
        return;
    }

    // Clear all previous data when loading new hex data
    this.clearAllLists();

    this.rawData = hexData;
    this.byteStates = new Array(hexData.length).fill('undefined');
    this.stagedBytes = [];
    this.renderHexdump();
    this.generateSuggestions();
    this.updateSelectionDecode();
}

parseHexInput(input) {
    const cleanInput = input.replace(/\s+/g, '').replace(/0x/gi, '');

    if (!/^[0-9a-fA-F]*$/.test(cleanInput)) {
        return [];
    }

    if (cleanInput.length % 2 !== 0) {
        return [];
    }

    const bytes = [];
    for (let i = 0; i < cleanInput.length; i += 2) {
        bytes.push(parseInt(cleanInput.substr(i, 2), 16));
    }

    return bytes;
}

renderHexdump() {
    const container = document.getElementById('hexdump');
    container.innerHTML = '';

    const bytesPerRow = 16;
    const totalRows = Math.ceil(this.rawData.length / bytesPerRow);

    for (let row = 0; row < totalRows; row++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'flex items-center mb-1';

        const offsetDiv = document.createElement('div');
        offsetDiv.className = 'text-gray-500 mr-4 w-20 text-xs';
        offsetDiv.textContent = (row * bytesPerRow).toString(16).padStart(8, '0').toUpperCase();
        rowDiv.appendChild(offsetDiv);

        const bytesDiv = document.createElement('div');
        bytesDiv.className = 'flex flex-wrap gap-0.5 mr-4';

        const startIdx = row * bytesPerRow;
        const endIdx = Math.min(startIdx + bytesPerRow, this.rawData.length);

        for (let i = startIdx; i < endIdx; i++) {
            const byteSpan = document.createElement('span');
            let classes = ['hex-byte', 'px-1', 'py-0.5', 'rounded', 'text-xs', 'cursor-pointer', 'min-w-[24px]', 'text-center'];

            if (this.byteStates[i] === 'decoded') {
                classes.push('bg-green-200', 'text-green-800');
            } else if (this.stagedBytes.includes(i)) {
                classes.push('bg-blue-200', 'text-blue-800', 'ring-1', 'ring-blue-400');
            } else if (this.isMaxConfidenceByte(i)) {
                classes.push('bg-blue-400', 'text-white', 'shadow-lg', 'shadow-blue-300', 'ring-2', 'ring-blue-500', 'max-confidence-glow');
            } else {
                classes.push('text-gray-700', 'hover:bg-gray-200');
            }

            byteSpan.className = classes.join(' ');
            byteSpan.textContent = this.rawData[i].toString(16).padStart(2, '0').toUpperCase();
            byteSpan.dataset.index = i;

            byteSpan.addEventListener('mouseenter', () => this.onByteHover(i));
            byteSpan.addEventListener('mouseleave', () => this.onByteUnhover(i));
            byteSpan.addEventListener('click', (e) => {
                if (this.isMaxConfidenceByte(i)) {
                    this.acceptMaxConfidenceSuggestion(i);
                } else {
                    this.handleByteClick(i, e.shiftKey);
                }
            });

            bytesDiv.appendChild(byteSpan);

            if ((i - startIdx + 1) % 8 === 0 && i < endIdx - 1) {
                const spacer = document.createElement('span');
                spacer.className = 'w-2';
                bytesDiv.appendChild(spacer);
            }
        }

        rowDiv.appendChild(bytesDiv);

        const asciiDiv = document.createElement('div');
        asciiDiv.className = 'text-gray-500 text-xs';
        let asciiText = '';
        for (let i = startIdx; i < endIdx; i++) {
            const byte = this.rawData[i];
            asciiText += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
        }
        asciiDiv.textContent = asciiText;
        rowDiv.appendChild(asciiDiv);

        container.appendChild(rowDiv);
    }
}

onByteHover(index) {
    this.highlightByte(index);
    this.highlightDecodingForByte(index);
}

onByteUnhover(index) {
    this.unhighlightByte(index);
    this.unhighlightAllDecodings();
}

highlightByte(index) {
    const byteElement = document.querySelector(`[data-index="${index}"]`);
    if (byteElement && !byteElement.classList.contains('bg-green-200') && !byteElement.classList.contains('bg-blue-200') && !this.isMaxConfidenceByte(index)) {
        byteElement.classList.add('bg-yellow-200');
    }
}

unhighlightByte(index) {
    const byteElement = document.querySelector(`[data-index="${index}"]`);
    if (byteElement) {
        byteElement.classList.remove('bg-yellow-200');
    }
}

highlightRange(startIndex, endIndex) {
    for (let i = startIndex; i < endIndex; i++) {
        const byteElement = document.querySelector(`[data-index="${i}"]`);
        if (byteElement) {
            // Remove green background if present and add yellow with higher priority
            byteElement.classList.remove('bg-green-200');
            byteElement.classList.add('bg-yellow-200', 'ring-2', 'ring-yellow-400');
        }
    }
}

unhighlightRange(startIndex, endIndex) {
    for (let i = startIndex; i < endIndex; i++) {
        const byteElement = document.querySelector(`[data-index="${i}"]`);
        if (byteElement) {
            byteElement.classList.remove('bg-yellow-200', 'ring-2', 'ring-yellow-400');
            // Restore green background if this byte is decoded
            if (this.byteStates[i] === 'decoded') {
                byteElement.classList.add('bg-green-200');
            }
        }
    }
}

highlightDecodingForByte(index) {
    const decoding = this.acceptedDecodings.find(d => 
        index >= d.range[0] && index < d.range[1]
    );
    if (decoding) {
        const decodingIndex = this.acceptedDecodings.indexOf(decoding);
        const decodingElement = document.querySelector(`[data-decoding-index="${decodingIndex}"]`);
        if (decodingElement) {
            decodingElement.classList.add('bg-yellow-100', 'ring-2', 'ring-yellow-400');
        }
    }
}

unhighlightAllDecodings() {
    document.querySelectorAll('[data-decoding-index]').forEach(el => {
        el.classList.remove('bg-yellow-100', 'ring-2', 'ring-yellow-400');
    });
}

handleByteClick(index, shiftKey) {
    if (shiftKey && this.lastClickedByte !== -1) {
        // Shift-click range selection
        const start = Math.min(this.lastClickedByte, index);
        const end = Math.max(this.lastClickedByte, index);
        
        // Clear current selection
        this.stagedBytes = [];
        
        // Select range, skipping already decoded bytes
        for (let i = start; i <= end; i++) {
            if (this.byteStates[i] !== 'decoded') {
                this.stagedBytes.push(i);
            }
        }
        
        this.renderHexdump();
        this.updateSelectionDecode();
    } else {
        // Normal single-byte toggle
        this.toggleByteStaging(index);
        this.lastClickedByte = index;
    }
}

toggleByteStaging(index) {
    if (this.byteStates[index] === 'decoded') {
        return;
    }

    const stagedIndex = this.stagedBytes.indexOf(index);
    if (stagedIndex > -1) {
        this.stagedBytes.splice(stagedIndex, 1);
    } else {
        this.stagedBytes.push(index);
    }

    this.stagedBytes.sort((a, b) => a - b);
    this.ensureSequentialStaging();
    this.renderHexdump();
    this.updateSelectionDecode();
}

ensureSequentialStaging() {
    if (this.stagedBytes.length <= 1) return;

    this.stagedBytes.sort((a, b) => a - b);
    const sequentialBytes = [this.stagedBytes[0]];

    for (let i = 1; i < this.stagedBytes.length; i++) {
        if (this.stagedBytes[i] === sequentialBytes[sequentialBytes.length - 1] + 1) {
            sequentialBytes.push(this.stagedBytes[i]);
        } else {
            break;
        }
    }

    this.stagedBytes = sequentialBytes;
}

updateSelectionDecode() {
    const container = document.getElementById('selectionDecodeList');
    const scrollIndicator = document.getElementById('scrollIndicator');
    container.innerHTML = '';

    if (this.stagedBytes.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">Select bytes to see interpretations</p>';
        scrollIndicator.classList.add('hidden');
        return;
    }

    // Add offset information at the top
    const startOffset = Math.min(...this.stagedBytes);
    const endOffset = Math.max(...this.stagedBytes);
    const offsetInfo = document.createElement('div');
    offsetInfo.className = 'text-xs text-gray-600 mb-2 pb-2 border-b border-gray-200';
    if (startOffset === endOffset) {
        offsetInfo.textContent = `Offset: ${startOffset} (1 byte)`;
    } else {
        offsetInfo.textContent = `Offsets: ${startOffset}-${endOffset} (${this.stagedBytes.length} bytes)`;
    }
    container.appendChild(offsetInfo);

    const interpretations = this.generateInterpretations(this.stagedBytes);
    interpretations.forEach(interpretation => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center p-1.5 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors';
        item.innerHTML = `
            <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between text-xs">
            <span class="font-medium text-gray-800">${interpretation.type}</span>
            <span class="text-gray-600 truncate ml-2">${interpretation.value}</span>
            </div>
            </div>
            `;
        item.addEventListener('click', () => this.acceptSelectionDecode(interpretation));
        container.appendChild(item);
    });

    // Check if scrolling is needed and show/hide indicator
    this.updateScrollIndicator();
}

updateScrollIndicator() {
    const container = document.getElementById('selectionDecodeList');
    const scrollIndicator = document.getElementById('scrollIndicator');

    // Check if content overflows
    setTimeout(() => {
        if (container.scrollHeight > container.clientHeight) {
            scrollIndicator.classList.remove('hidden');

            // Hide indicator when scrolled to bottom
            const checkScroll = () => {
                const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 5;
                if (isAtBottom) {
                    scrollIndicator.classList.add('hidden');
                } else {
                    scrollIndicator.classList.remove('hidden');
                }
            };

            container.addEventListener('scroll', checkScroll);
            checkScroll(); // Initial check
        } else {
            scrollIndicator.classList.add('hidden');
        }
    }, 10);
}

generateInterpretations(indices) {
    if (indices.length === 0) return [];

    const bytes = indices.map(i => this.rawData[i]);
    const interpretations = [];

    if (indices.length === 1) {
        const byteValue = bytes[0];

        interpretations.push({
            type: 'u8',
            value: byteValue.toString(),
            range: [indices[0], indices[0] + 1]
        });

        // Add boolean interpretation for 0 and 1
        if (byteValue === 0 || byteValue === 1) {
            interpretations.push({
                type: 'Bool',
                value: byteValue === 1 ? 'true' : 'false',
                range: [indices[0], indices[0] + 1]
            });

            // Add Option interpretation
            interpretations.push({
                type: 'Option',
                value: byteValue === 1 ? 'Some' : 'None',
                range: [indices[0], indices[0] + 1]
            });
        }

        // Add bump interpretation for 252-255
        if (byteValue >= 252 && byteValue <= 255) {
            interpretations.push({
                type: 'Bump',
                value: `${byteValue} (bump seed)`,
                range: [indices[0], indices[0] + 1]
            });
        }
    }

    if (indices.length >= 2) {
        const u16LE = bytes[0] | (bytes[1] << 8);
        const u16BE = (bytes[0] << 8) | bytes[1];
        interpretations.push({
            type: 'u16 (LE)',
            value: u16LE.toString(),
            range: [indices[0], indices[0] + 2]
        });
        interpretations.push({
            type: 'u16 (BE)',
            value: u16BE.toString(),
            range: [indices[0], indices[0] + 2]
        });
    }

    if (indices.length >= 4) {
        const u32LE = this.readUInt32LE(indices[0]);
        const u32BE = this.readUInt32BE(indices[0]);
        const i32LE = this.readInt32LE(indices[0]);
        const f32LE = this.readFloat32LE(indices[0]);

        interpretations.push({
            type: 'u32 (LE)',
            value: u32LE.toString(),
            range: [indices[0], indices[0] + 4]
        });
        interpretations.push({
            type: 'i32 (LE)',
            value: i32LE.toString(),
            range: [indices[0], indices[0] + 4]
        });
        interpretations.push({
            type: 'f32 (LE)',
            value: f32LE.toFixed(6),
            range: [indices[0], indices[0] + 4]
        });

        if (u32LE > 946684800 && u32LE < 4102444800) { // 2000-01-01 to 2100-01-01
            const timestamp = new Date(u32LE * 1000);
            const now = new Date();
            const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
            const hundredYearsFromNow = new Date(now.getFullYear() + 100, now.getMonth(), now.getDate());

            if (timestamp >= fiveYearsAgo && timestamp <= hundredYearsFromNow) {
                interpretations.push({
                    type: 'Unix Timestamp',
                    value: timestamp.toISOString(),
                    range: [indices[0], indices[0] + 4]
                });
            }
        }
    }

    if (indices.length >= 8) {
        const u64LE = this.readUInt64LE(indices[0]);
        const f64LE = this.readFloat64LE(indices[0]);

        interpretations.push({
            type: 'u64 (LE)',
            value: u64LE.toString(),
            range: [indices[0], indices[0] + 8]
        });
        interpretations.push({
            type: 'f64 (LE)',
            value: f64LE.toFixed(6),
            range: [indices[0], indices[0] + 8]
        });
    }

    if (indices.length === 32) {
        const pubkeyHex = bytes.map(b => b.toString(16).padStart(2, '0')).join('');
        const pubkeyBase58 = this.hexToBase58(pubkeyHex);

        // Add initial pubkey interpretation
        const pubkeyInterpretation = {
            type: 'Solana Pubkey',
            value: pubkeyBase58,
            range: [indices[0], indices[0] + 32],
            isChecking: true
        };

        interpretations.push(pubkeyInterpretation);

        // Check if account exists asynchronously
        this.checkPubkeyExists(pubkeyBase58, pubkeyInterpretation);
    }

    // ASCII String interpretation for any length
    if (indices.length > 0) {
        const asciiValue = this.bytesToAsciiString(bytes);
        interpretations.push({
            type: 'ASCII String',
            value: asciiValue,
            range: [indices[0], indices[indices.length - 1] + 1]
        });
    }

    // Sort interpretations by byte length (longer first), then by type priority
    interpretations.sort((a, b) => {
        const aLength = a.range[1] - a.range[0];
        const bLength = b.range[1] - b.range[0];
        
        if (aLength !== bLength) {
            return bLength - aLength; // Longer first
        }
        
        // Same length - use type priority order (unsigned, signed, other, floats last)
        const typePriority = {
            'Solana Pubkey': 1,
            'u64': 2,
            'u32': 3,
            'u16 (BE)': 4,
            'u16 (LE)': 5,
            'u8': 6,
            'i32': 7,
            'Unix Timestamp': 8,
            'ASCII String': 9,
            'Bump': 10,
            'Bool': 11,
            'Option': 12,
            'f32': 13,
            'f64': 14
        };
        
        return (typePriority[a.type] || 999) - (typePriority[b.type] || 999);
    });

    return interpretations;
}

acceptSelectionDecode(interpretation) {
    const name = prompt('Enter a name for this field:', `field_${this.acceptedDecodings.length}`);
    if (name === null) return;

    for (let i = interpretation.range[0]; i < interpretation.range[1]; i++) {
        this.byteStates[i] = 'decoded';
    }

    this.acceptedDecodings.push({
        name: name || `field_${this.acceptedDecodings.length}`,
        type: interpretation.type,
        value: interpretation.value,
        range: interpretation.range,
        offset: interpretation.range[0]
    });

    this.stagedBytes = [];
    this.renderHexdump();
    this.updateSelectionDecode();
    this.updateAcceptedDecodings();
}

updateAcceptedDecodings() {
    const container = document.getElementById('acceptedList');
    container.innerHTML = '';

    if (this.acceptedDecodings.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No accepted decodings yet</p>';
        return;
    }

    this.acceptedDecodings.sort((a, b) => a.offset - b.offset);

    this.acceptedDecodings.forEach((decoding, index) => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer';
        item.dataset.decodingIndex = index;

        // Check if this is a Solana pubkey
        const isSolanaPubkey = decoding.type === 'Solana Pubkey';
        let solanaButtons = '';

        if (isSolanaPubkey) {
            const pubkey = decoding.value.split(' (')[0]; // Extract pubkey from "pubkey (account type)" format
                solanaButtons = `
                <button class="ml-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors" 
                onclick="reverseDataTool.openSolscan('${pubkey}')" title="View on Solscan">
                📊
                </button>
                <button class="ml-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors" 
                onclick="reverseDataTool.analyzeAccount('${pubkey}')" title="Analyze account data">
                🔍
                </button>
                `;
            }

        item.innerHTML = `
            <div class="flex-1 min-w-0">
            <div class="font-medium text-sm text-gray-800 cursor-text hover:bg-gray-100 rounded px-1 py-0.5 transition-colors" 
        onclick="reverseDataTool.editDecodingName(${index}, this)"
        title="Click to edit name">${decoding.name}</div>
            <div class="text-xs text-gray-600">${decoding.type} @ ${decoding.offset}</div>
            <div class="text-xs text-gray-700 truncate">${decoding.value}</div>
            </div>
            <div class="flex items-center">
            ${solanaButtons}
            <button class="ml-2 text-red-500 hover:text-red-700 text-lg font-bold" onclick="reverseDataTool.removeAcceptedDecoding(${index})">×</button>
            </div>
            `;

        item.addEventListener('mouseenter', () => this.highlightRange(decoding.range[0], decoding.range[1]));
        item.addEventListener('mouseleave', () => this.unhighlightRange(decoding.range[0], decoding.range[1]));

        container.appendChild(item);
    });
}

editDecodingName(index, element) {
    const currentName = this.acceptedDecodings[index].name;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'font-medium text-sm text-gray-800 bg-white border border-blue-300 rounded px-1 py-0.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500';

    // Replace the div with input
    element.parentNode.replaceChild(input, element);
    input.focus();
    input.select();

    const saveEdit = () => {
        const newName = input.value.trim();
        if (newName && newName !== currentName) {
            this.acceptedDecodings[index].name = newName;
        }
        this.updateAcceptedDecodings();
    };

    const cancelEdit = () => {
        this.updateAcceptedDecodings();
    };

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        }
    });
}

removeAcceptedDecoding(index) {
    const decoding = this.acceptedDecodings[index];
    for (let i = decoding.range[0]; i < decoding.range[1]; i++) {
        this.byteStates[i] = 'undefined';
    }

    this.acceptedDecodings.splice(index, 1);
    this.renderHexdump();
    this.updateAcceptedDecodings();
}

async generateSuggestions() {
    this.suggestions = [];

    // Show initial suggestions
    this.detectDiscriminator();
    this.detectSpecialNumbers();
    this.detectMeaningfulStrings();
    this.detectPatternMatches();
    this.renderSuggestions();

    // Show loading indicator for Solana detection
    this.showSolanaLoadingIndicator();

    // Detect Solana accounts (this may take time)
    await this.detectSolanaAccounts();

    // Hide loading indicator and update final suggestions
    this.hideSolanaLoadingIndicator();
    this.renderSuggestions();
    this.highlightMaxConfidenceSuggestions();
}

showSolanaLoadingIndicator() {
    const container = document.getElementById('suggestionsList');
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'solana-loading';
    loadingDiv.className = 'flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200';
    loadingDiv.innerHTML = `
        <div class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span class="text-sm text-blue-700">Checking Solana blockchain...</span>
        `;
    container.appendChild(loadingDiv);
}

hideSolanaLoadingIndicator() {
    const loadingDiv = document.getElementById('solana-loading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

isAllZeros(startIndex, length) {
    for (let i = startIndex; i < startIndex + length && i < this.rawData.length; i++) {
        if (this.rawData[i] !== 0) {
            return false;
        }
    }
    return true;
}

detectDiscriminator() {
    // Only suggest discriminator for account data
    if (!this.isAccountData || this.rawData.length < 8) {
        return;
    }

    // Check if first 8 bytes are available for suggestion
    if (this.byteStates.slice(0, 8).every(state => state === 'undefined')) {
        const discriminatorBytes = this.rawData.slice(0, 8);
        const discriminatorHex = discriminatorBytes.map(b => b.toString(16).padStart(2, '0')).join('');

        this.suggestions.push({
            type: 'Discriminator',
            range: [0, 8],
            value: `0x${discriminatorHex}`,
            confidence: 0.95
        });
    }
}

async checkIfPDA(pubkey) {
    try {
        // Simple check - if pubkey is on curve it's not a PDA
        // This is a simplified implementation
        // In a full implementation, you'd use ed25519 curve math
        return false; // For now, assume all are regular accounts
    } catch (error) {
        return false;
    }
}

renderAccountInfoBox() {
    if (!this.isAccountData || !this.currentAccountInfo) {
        return;
    }

    // Find the hexdump container parent
    const hexdumpParent = document.getElementById('hexdump').parentElement;

    // Remove existing account info box if present
    const existingBox = document.getElementById('account-info-box');
    if (existingBox) {
        existingBox.remove();
    }

    // Create account info box
    const accountInfoBox = document.createElement('div');
    accountInfoBox.id = 'account-info-box';
    accountInfoBox.className = 'bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3';

    const ownerProgram = this.knownPrograms[this.currentAccountInfo.owner] || 'Unknown Program';
    const solAmount = (this.currentAccountInfo.lamports / 1e9).toFixed(4);
    const pdaStatus = this.currentAccountInfo.isPDA ? 'PDA' : 'Regular';

    accountInfoBox.innerHTML = `
        <div class="flex items-center justify-between">
        <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div>
        <span class="font-medium text-gray-600">Account:</span>
        <div class="font-mono text-gray-800">${this.currentAccountInfo.address.substring(0, 8)}...${this.currentAccountInfo.address.slice(-4)}</div>
        </div>
        <div>
        <span class="font-medium text-gray-600">Owner:</span>
        <div class="text-gray-800">${ownerProgram}</div>
        <div class="font-mono text-gray-500 text-xs">${this.currentAccountInfo.owner}</div>
        </div>
        <div>
        <span class="font-medium text-gray-600">Details:</span>
        <div class="text-gray-800">${solAmount} SOL • ${this.rawData.length} bytes • ${pdaStatus}</div>
        </div>
        </div>
        <div class="flex gap-1 ml-3">
        <button onclick="reverseDataTool.openSolscan('${this.currentAccountInfo.address}')" 
    class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" title="View on Solscan">
        📊
        </button>
        <button onclick="reverseDataTool.openCreateAccountInstruction('${this.currentAccountInfo.address}')" 
    class="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors" title="Find creation IX">
        🔍
        </button>
        </div>
        </div>
        `;

    // Insert before hexdump
    hexdumpParent.insertBefore(accountInfoBox, hexdumpParent.firstChild);
}

openCreateAccountInstruction(pubkey) {
    // Open Solscan to search for createAccount instruction for this account
    window.open(`https://solscan.io/account/${pubkey}#transactions`, '_blank');
}

detectPatternMatches() {

    // Convert raw data to hex string for pattern matching
    const hexString = this.rawData.map(byte => byte.toString(16).padStart(2, '0')).join('');

    // Check all pattern categories
    for (const [category, patterns] of Object.entries(this.patterns)) {
        for (const [pattern, description] of Object.entries(patterns)) {
            // Find all occurrences of this pattern
            let index = 0;
            while (index < hexString.length) {
                const foundIndex = hexString.indexOf(pattern.toLowerCase(), index);
                if (foundIndex === -1) break;

                // Convert hex character index to byte index
                const byteOffset = foundIndex / 2;
                const patternLength = pattern.length / 2;

                // Skip if this would go beyond our data
                if (byteOffset + patternLength > this.rawData.length) break;

                // Only suggest if bytes are not already decoded
                if (this.byteStates.slice(byteOffset, byteOffset + patternLength).every(state => state === 'undefined')) {
                    // Determine confidence based on pattern category
                    let confidence = 0.8; // Default confidence
                    let categoryName = category;

                    if (category === 'discriminators') {
                        confidence = 1.00;
                        categoryName = 'Known Discriminator';
                    } else if (category === 'constants') {
                        confidence = 0.85;
                        categoryName = 'Known Constant';
                    }

                    this.suggestions.push({
                        type: categoryName,
                        range: [byteOffset, byteOffset + patternLength],
                        value: description,
                        confidence: confidence,
                        pattern: pattern.toUpperCase()
                    });

                    console.log(`[PATTERN HIT] Found ${categoryName} at offset ${byteOffset}: ${pattern.toUpperCase()} -> "${description}"`);
                }

                // Continue searching after this match
                index = foundIndex + 2; // Move by 1 byte (2 hex chars)
            }
        }
    }
}

detectSpecialNumbers() {
    const specialValues = new Set([0, 1, -1, 10, 100, 1000, 10000, 100000, 1000000, 1000000000, 10000000000, 100000000000]);
    const roundValues = [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000, 1000000000, 10000000000, 100000000000];
    const repeatingPatterns = [11111, 22222, 33333, 44444, 55555, 66666, 77777, 88888, 99999, 111111, 222222, 333333, 444444, 555555, 666666, 777777, 888888, 999999];

    // Check 4-byte integers
    for (let i = 0; i <= this.rawData.length - 4; i++) {
        if (this.byteStates.slice(i, i + 4).every(state => state === 'undefined')) {
            // Skip if all bytes are zero
            if (this.isAllZeros(i, 4)) {
                continue;
            }

            const u32LE = this.readUInt32LE(i);
            const i32LE = this.readInt32LE(i);

            // Special values (excluding 0 since we skip all-zero sequences)
            if (specialValues.has(u32LE) && u32LE !== 0) {
                this.suggestions.push({
                    type: 'u32',
                    range: [i, i + 4],
                    value: u32LE.toString(),
                    confidence: 0.9
                });
            } else if (specialValues.has(i32LE) && i32LE !== 0) {
                this.suggestions.push({
                    type: 'i32',
                    range: [i, i + 4],
                    value: i32LE.toString(),
                    confidence: 0.9
                });
            }

            // Round decimal values
            else if (roundValues.includes(u32LE)) {
                this.suggestions.push({
                    type: 'u32',
                    range: [i, i + 4],
                    value: u32LE.toString(),
                    confidence: 0.8
                });
            }
            
            // Numbers with many trailing zeros (like 20000000)
            else if (u32LE > 0 && this.hasTrailingZeros(u32LE)) {
                const zeroCount = this.countTrailingZeroDigits(u32LE);
                if (zeroCount >= 3) {
                    this.suggestions.push({
                        type: 'u32 (round)',
                        range: [i, i + 4],
                        value: u32LE.toLocaleString(),
                        confidence: 0.91
                    });
                }
            }

            // Repeating digit patterns
            else if (repeatingPatterns.includes(u32LE)) {
                this.suggestions.push({
                    type: 'u32 (pattern)',
                    range: [i, i + 4],
                    value: u32LE.toString(),
                    confidence: 0.75
                });
            }

            // Unix timestamps (smart range: 5 years back to 5 years future)
            else if (u32LE > 946684800 && u32LE < 4102444800) { // 2000-01-01 to 2100-01-01
                const date = new Date(u32LE * 1000);
                const now = new Date();
                const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
                const fiveYearsFromNow = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate());

                if (date >= fiveYearsAgo && date <= fiveYearsFromNow) {
                    let confidence = 0.75;

                    // Higher confidence for exact times (seconds = 0)
                    if (date.getSeconds() === 0) {
                        confidence = 0.85;

                        // Even higher for exact minutes (minutes = 0 too)
                        if (date.getMinutes() === 0) {
                            confidence = 0.9;
                        }
                    }

                    this.suggestions.push({
                        type: 'Unix Timestamp',
                        range: [i, i + 4],
                        value: date.toISOString(),
                        confidence: confidence
                    });
                }
            }

            // Powers of 2
            else if ((u32LE & (u32LE - 1)) === 0 && u32LE > 1 && u32LE <= 1048576) {
                this.suggestions.push({
                    type: 'u32 (power of 2)',
                    range: [i, i + 4],
                    value: u32LE.toString(),
                    confidence: 0.7
                });
            }
        }
    }

    // Check 8-byte integers for special values
    for (let i = 0; i <= this.rawData.length - 8; i++) {
        if (this.byteStates.slice(i, i + 8).every(state => state === 'undefined')) {
            // Skip if all bytes are zero
            if (this.isAllZeros(i, 8)) {
                continue;
            }

            const u64LE = this.readUInt64LE(i);
            const u64Value = Number(u64LE);

            if ((specialValues.has(u64Value) && u64Value !== 0) || roundValues.includes(u64Value)) {
                this.suggestions.push({
                    type: 'u64',
                    range: [i, i + 8],
                    value: u64LE.toString(),
                    confidence: 0.8
                });
            }
            
            // Numbers with many trailing zeros (like 20000000) for u64
            else if (u64Value > 0 && this.hasTrailingZeros(u64Value)) {
                const zeroCount = this.countTrailingZeroDigits(u64Value);
                if (zeroCount >= 3) {
                    this.suggestions.push({
                        type: 'u64 (round)',
                        range: [i, i + 8],
                        value: u64LE.toLocaleString(),
                        confidence: 0.95
                    });
                }
            }
        }
    }
}

hasTrailingZeros(number) {
    const str = number.toString();
    if (!str.endsWith('0') || str.length <= 1) {
        return false;
    }
    
    // Only consider it "round" if it's a power of 10 multiplied by a small number
    // This prevents false positives like large random numbers that happen to end in zeros
    const nonZeroDigits = str.replace(/0+$/, '');
    return nonZeroDigits.length <= 3; // Only 1-3 significant digits before the zeros
}

countTrailingZeroDigits(number) {
    const str = number.toString();
    let count = 0;
    for (let i = str.length - 1; i >= 0; i--) {
        if (str[i] === '0') {
            count++;
        } else {
            break;
        }
    }
    return count;
}

detectMeaningfulStrings() {
    const commonWords = new Set([
        'the', 'and', 'http', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'may', 'she', 'use', 'your', 'each', 'make', 'most', 'over', 'said', 'some', 'time', 'very', 'what', 'with', 'have', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'look', 'than', 'come', 'could', 'first', 'into', 'made', 'many', 'more', 'only', 'over', 'such', 'take', 'than', 'them', 'well', 'were',
        'error', 'info', 'warn', 'debug', 'trace', 'log', 'message', 'data', 'file', 'path', 'name', 'value', 'key', 'id', 'index', 'count', 'size', 'length', 'width', 'height', 'type', 'format', 'version', 'config', 'setting', 'option', 'param', 'arg', 'flag', 'status', 'state', 'mode', 'level', 'class', 'object', 'item', 'element', 'node', 'list', 'array', 'string', 'number', 'bool', 'true', 'false', 'null', 'void', 'empty', 'full', 'start', 'end', 'begin', 'finish', 'init', 'create', 'update', 'delete', 'remove', 'add', 'insert', 'find', 'search', 'get', 'set', 'put', 'post', 'send', 'recv', 'read', 'write', 'open', 'close', 'save', 'load', 'import', 'export', 'parse', 'encode', 'decode', 'hash', 'sign', 'verify', 'crypt', '.com', 'compress', 'decompress'
    ]);

    for (let i = 0; i < this.rawData.length; i++) {
        if (this.byteStates[i] === 'undefined') {
            // Skip if starting with zero bytes
            if (this.rawData[i] === 0) {
                continue;
            }

            let stringLength = 0;
            let hasLetters = false;
            let hasNumbers = false;
            let alphaCount = 0;

            for (let j = i; j < this.rawData.length && j < i + 128; j++) {
                const byte = this.rawData[j];
                if (byte === 0) break;
                if (byte < 32 || byte > 126) break;

                stringLength++;
                const char = String.fromCharCode(byte);
                if (/[a-zA-Z]/.test(char)) {
                    hasLetters = true;
                    alphaCount++;
                } else if (/[0-9]/.test(char)) {
                    hasNumbers = true;
                }
            }

            if (stringLength >= 3 && hasLetters && alphaCount >= stringLength * 0.6) {
                const stringValue = String.fromCharCode(...this.rawData.slice(i, i + stringLength));
                const words = stringValue.toLowerCase().split(/[^a-z]+/).filter(w => w.length >= 3);
                const knownWords = words.filter(w => commonWords.has(w));

                let confidence = 0.5;
                if (knownWords.length > 0) {
                    confidence = 0.7 + (knownWords.length / words.length) * 0.2;
                } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(stringValue)) {
                    confidence = 0.65; // Looks like an identifier
                } else if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(stringValue)) {
                    confidence = 0.95; // Email
                } else if (/^https?:\/\//.test(stringValue)) {
                    confidence = 0.95; // URL
                } else if (/^[a-fA-F0-9]{8,}$/.test(stringValue)) {
                    confidence = 0.6; // Hex string
                }

                if (confidence > 0.6) {
                    this.suggestions.push({
                        type: 'String',
                        range: [i, i + stringLength],
                        value: `"${stringValue}"`,
                        confidence: confidence
                    });
                }
            }
        }
    }
}

async detectSolanaAccounts() {
    console.log('Starting Solana account detection...');
    this.showToast('Looking for potential Solana accounts...', 'info', 5000);
    const accountsToCheck = [];

    // Collect all potential accounts first
    for (let i = 0; i <= this.rawData.length - 32; i++) {
        if (this.byteStates.slice(i, i + 32).every(state => state === 'undefined')) {
            // Skip if all bytes are zero
            if (this.isAllZeros(i, 32)) {
                continue;
            }

            const pubkeyBytes = this.rawData.slice(i, i + 32);

            // Convert directly to base58 and check if it's a valid Solana pubkey format
            try {
                const pubkeyBase58 = this.bytesToBase58(pubkeyBytes);

                // Basic validation: Solana pubkeys are 32 bytes = 44 base58 chars (typically)
                if (pubkeyBase58.length >= 32 && pubkeyBase58.length <= 44 && this.isValidBase58(pubkeyBase58)) {
                    accountsToCheck.push({
                        pubkey: pubkeyBase58,
                        offset: i
                    });
                }
            } catch (error) {
                // Skip invalid base58 conversions
                continue;
            }
        }
    }

    console.log(`Found ${accountsToCheck.length} potential Solana accounts to check`);

    if (accountsToCheck.length === 0) {
        console.log('No potential Solana accounts found');
        return;
    }

    // Choose processing method based on batching setting
    if (this.enableBatching) {
        // Process in batches using batched RPC calls
        const batchSize = 5; // Smaller batch size to be gentler on RPC
        const delayBetweenBatches = 500; // 500ms delay between batches

        for (let i = 0; i < accountsToCheck.length; i += batchSize) {
            const batch = accountsToCheck.slice(i, i + batchSize);
            await this.checkSolanaAccountsBatch(batch);

            // Add delay between batches if there are more to process
            if (i + batchSize < accountsToCheck.length) {
                console.log(`Processed batch ${Math.floor(i / batchSize) + 1}, waiting ${delayBetweenBatches}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }
    } else {
        // Process individually for free RPCs that don't support batching
        const delayBetweenCalls = 200; // Small delay between individual calls

        for (let i = 0; i < accountsToCheck.length; i++) {
            const account = accountsToCheck[i];
            await this.checkSolanaAccount(account.pubkey, account.offset);

            // Add delay between calls if there are more to process
            if (i < accountsToCheck.length - 1) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenCalls));
            }
        }
    }

    console.log('Solana account detection completed');
    this.showToast('Solana account detection completed', 'success');
}

async checkSolanaAccountsBatch(accounts, retryCount = 0) {
    const maxRetries = this.solanaRpcUrls.length;

    if (retryCount >= maxRetries) {
        console.warn(`Failed to check batch on all RPC endpoints`);
        return;
    }

    const currentUrl = this.solanaRpcUrls[retryCount];

    try {
        // Create batched RPC request
        const batchRequest = accounts.map((account, index) => ({
            jsonrpc: '2.0',
            id: `batch_${account.offset}_${index}`,
            method: 'getAccountInfo',
            params: [account.pubkey, { encoding: 'base64' }]
        }));

        const headers = {
            'Content-Type': 'application/json',
        };

        console.log(`Checking batch of ${accounts.length} accounts via ${currentUrl}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.rpcTimeout);

        const response = await fetch(currentUrl, {
            method: 'POST',
            mode: 'cors',
            headers: headers,
            body: JSON.stringify(batchRequest),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const batchResults = await response.json();

        // Process each result in the batch
        if (Array.isArray(batchResults)) {
            batchResults.forEach((data, index) => {
                const account = accounts[index];
                this.processSolanaAccountResult(data, account.pubkey, account.offset, currentUrl);
            });
        } else {
            // Single result case (shouldn't happen with batch, but handle gracefully)
            const account = accounts[0];
            this.processSolanaAccountResult(batchResults, account.pubkey, account.offset, currentUrl);
        }

    } catch (error) {
        // Try next RPC endpoint on any fetch errors
        if (retryCount < maxRetries - 1) {
            console.log(`Batch error with ${currentUrl} (${error.message}), trying next endpoint...`);
            return this.checkSolanaAccountsBatch(accounts, retryCount + 1);
        }

        // Show toast for final failure
        this.showToast(`RPC batch request failed: ${error.message}`, 'error');
    }
}

processSolanaAccountResult(data, pubkey, offset, rpcUrl) {
    // Check for RPC errors
    if (data.error) {
        // Don't log common "account not found" errors as they're expected
        if (!data.error.message?.includes('could not find account')) {
            console.warn(`RPC error for ${pubkey} on ${rpcUrl}:`, data.error);
        }
        return;
    }

    // Check if account exists and has non-zero lamports
    if (data.result && data.result.value && data.result.value.lamports > 0) {
        const accountInfo = data.result.value;
        const accountDetails = this.analyzeAccountInfo(accountInfo, pubkey);

        console.log(`Found valid Solana account: ${pubkey} (${accountDetails.type}) with ${accountInfo.lamports} lamports (via ${rpcUrl})`);

        // Calculate confidence based on zero byte count
        const pubkeyBytes = this.rawData.slice(offset, offset + 32);
        const zeroByteCount = pubkeyBytes.filter(byte => byte === 0).length;
        let confidence = 0.95; // Base confidence for verified accounts

        if (zeroByteCount <= 20) {
            confidence = 1.0; // Maximum confidence - very likely a real pubkey
        } else {
            confidence = Math.max(0.7, 0.95 - (zeroByteCount - 20) * 0.05); // Reduce confidence for many zeros
        }

        this.suggestions.push({
            type: 'Solana Pubkey',
            range: [offset, offset + 32],
            value: pubkey,
            confidence: confidence,
            lamports: accountInfo.lamports,
            accountDetails: accountDetails,
            isMaxConfidence: confidence === 1.0
        });

        // Update suggestions immediately when found
        this.renderSuggestions();

        // Cache the successful response
        this.accountCache.set(pubkey, {
            accountInfo: accountInfo,
            timestamp: Date.now()
        });
    } else {
        // Cache negative result (account doesn't exist or has 0 lamports)
        this.accountCache.set(pubkey, {
            accountInfo: null,
            timestamp: Date.now()
        });
    }
}

async checkSolanaAccount(pubkey, offset, retryCount = 0) {
    // Check cache first
    const cacheKey = pubkey;
    const cached = this.accountCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        const cacheAge = Math.round((Date.now() - cached.timestamp) / 1000);
        console.log(`[CACHE HIT] Using cached account data for ${pubkey} (age: ${cacheAge}s)`);

        if (cached.accountInfo && cached.accountInfo.lamports > 0) {
            const accountDetails = this.analyzeAccountInfo(cached.accountInfo, pubkey);

            // Calculate confidence based on zero byte count
            const pubkeyBytes = this.rawData.slice(offset, offset + 32);
            const zeroByteCount = pubkeyBytes.filter(byte => byte === 0).length;
            let confidence = 0.95;

            if (zeroByteCount <= 20) {
                confidence = 1.0;
            } else {
                confidence = Math.max(0.7, 0.95 - (zeroByteCount - 20) * 0.05);
            }

            this.suggestions.push({
                type: 'Solana Pubkey',
                range: [offset, offset + 32],
                value: pubkey,
                confidence: confidence,
                lamports: cached.accountInfo.lamports,
                accountDetails: accountDetails,
                isMaxConfidence: confidence === 1.0
            });

            this.renderSuggestions();
        }
        return;
    }

    const maxRetries = this.solanaRpcUrls.length;

    if (retryCount >= maxRetries) {
        console.warn(`Failed to check ${pubkey} on all RPC endpoints`);
        return;
    }

    const currentUrl = this.solanaRpcUrls[retryCount];

    try {
        const requestBody = {
            jsonrpc: '2.0',
            id: `check_${offset}`,
            method: 'getAccountInfo',
            params: [pubkey, { encoding: 'base64' }]
        };

        const headers = {
            'Content-Type': 'application/json',
        };

        // Add special headers for CORS proxy
        if (currentUrl.includes('cors-anywhere')) {
            headers['X-Requested-With'] = 'XMLHttpRequest';
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.rpcTimeout);

        const response = await fetch(currentUrl, {
            method: 'POST',
            mode: 'cors',
            headers: headers,
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Check for RPC errors
        if (data.error) {
            // Don't log common "account not found" errors as they're expected
            if (!data.error.message?.includes('could not find account')) {
                console.warn(`RPC error for ${pubkey} on ${currentUrl}:`, data.error);
            }
            return;
        }

        // Check if account exists and has non-zero lamports
        if (data.result && data.result.value && data.result.value.lamports > 0) {
            const accountInfo = data.result.value;
            const accountDetails = this.analyzeAccountInfo(accountInfo, pubkey);

            console.log(`Found valid Solana account: ${pubkey} (${accountDetails.type}) with ${accountInfo.lamports} lamports (via ${currentUrl})`);

            // Calculate confidence based on zero byte count
            const pubkeyBytes = this.rawData.slice(offset, offset + 32);
            const zeroByteCount = pubkeyBytes.filter(byte => byte === 0).length;
            let confidence = 0.95; // Base confidence for verified accounts

            if (zeroByteCount <= 20) {
                confidence = 1.0; // Maximum confidence - very likely a real pubkey
            } else {
                confidence = Math.max(0.7, 0.95 - (zeroByteCount - 20) * 0.05); // Reduce confidence for many zeros
            }

            this.suggestions.push({
                type: 'Solana Pubkey',
                range: [offset, offset + 32],
                value: pubkey,
                confidence: confidence,
                lamports: accountInfo.lamports,
                accountDetails: accountDetails,
                isMaxConfidence: confidence === 1.0
            });

            // Update suggestions immediately when found
            this.renderSuggestions();

            // Cache the successful response
            this.accountCache.set(pubkey, {
                accountInfo: accountInfo,
                timestamp: Date.now()
            });
            console.log(`[CACHE STORE] Cached account data for ${pubkey} (${accountInfo.lamports} lamports)`);
        } else {
            // Cache negative result (account doesn't exist or has 0 lamports)
            this.accountCache.set(pubkey, {
                accountInfo: null,
                timestamp: Date.now()
            });
            console.log(`[CACHE STORE] Cached negative result for ${pubkey} (account not found or 0 lamports)`);
        }
    } catch (error) {
        // Try next RPC endpoint on any fetch errors (including CORS)
        if (retryCount < maxRetries - 1) {
            console.log(`Error with ${currentUrl} (${error.message}), trying next endpoint...`);
            return this.checkSolanaAccount(pubkey, offset, retryCount + 1);
        }

        // Show toast for final failure
        this.showToast(`RPC request failed for ${pubkey.substring(0, 8)}...: ${error.message}`, 'error');
    }
}

analyzeAccountInfo(accountInfo, pubkey) {
    const owner = accountInfo.owner;
    const dataSize = accountInfo.data ? accountInfo.data.length : 0;
    const programName = this.knownPrograms[owner] || 'Unknown Program';

    let accountType = 'Unknown Account';
    let details = {};

    // System Program accounts
    if (owner === '11111111111111111111111111111111') {
        accountType = 'System Account';
        details.description = 'Native SOL account';
    }

    // SPL Token Program accounts
    else if (owner === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
        if (dataSize === this.TOKEN_ACCOUNT_SIZE) {
            accountType = 'SPL Token Account';
            details = this.parseTokenAccount(accountInfo.data);
        } else if (dataSize === this.TOKEN_MINT_SIZE) {
            accountType = 'SPL Token Mint';
            details = this.parseTokenMint(accountInfo.data);
        } else {
            accountType = 'SPL Token Program Account';
        }
    }

    // Token-2022 Program accounts
    else if (owner === 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb') {
        if (dataSize >= this.TOKEN_ACCOUNT_SIZE) {
            accountType = 'Token-2022 Account';
            details = this.parseTokenAccount(accountInfo.data);
        } else if (dataSize >= this.TOKEN_MINT_SIZE) {
            accountType = 'Token-2022 Mint';
            details = this.parseTokenMint(accountInfo.data);
        } else {
            accountType = 'Token-2022 Program Account';
        }
    }

    // Squads Multisig accounts
    else if (owner === 'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf' || 
        owner === 'SMPLecH534NA9acpos4G6x7uf3LWbCAwZQE9e8ZekMu') {
        accountType = 'Squads Multisig';
        details.description = 'Squads multisig account';
        details.version = owner === 'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf' ? 'v3' : 'v4';
    }

    // Other known programs
    else if (this.knownPrograms[owner]) {
        accountType = `${programName} Account`;
        details.description = `Account owned by ${programName}`;
    }

    return {
        type: accountType,
        owner: owner,
        ownerProgram: programName,
        dataSize: dataSize,
        lamports: accountInfo.lamports,
        executable: accountInfo.executable,
        rentEpoch: accountInfo.rentEpoch,
        ...details
    };
}

parseTokenAccount(data) {
    try {
        // Parse SPL Token Account structure (simplified)
        // This is a basic implementation - full parsing would require proper borsh deserialization
        if (!data || data.length < this.TOKEN_ACCOUNT_SIZE) {
            return { error: 'Invalid token account data' };
        }

        return {
            description: 'SPL Token holding account',
            note: 'Contains token balance and metadata'
        };
    } catch (error) {
        return { error: 'Failed to parse token account' };
    }
}

parseTokenMint(data) {
    try {
        // Parse SPL Token Mint structure (simplified)
        if (!data || data.length < this.TOKEN_MINT_SIZE) {
            return { error: 'Invalid token mint data' };
        }

        return {
            description: 'SPL Token mint authority',
            note: 'Defines token supply and decimals'
        };
    } catch (error) {
        return { error: 'Failed to parse token mint' };
    }
}

isValidBase58(str) {
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    return base58Regex.test(str);
}

bytesToBase58(bytes) {
    return this.base58Encode(bytes);
}

hexToBase58(hex) {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return this.base58Encode(bytes);
}

base58Encode(bytes) {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

    // Handle empty input
    if (bytes.length === 0) return '';

    // Convert bytes to a big integer
    let num = BigInt(0);
    for (const byte of bytes) {
        num = num * BigInt(256) + BigInt(byte);
    }

    // Convert to base58
    let encoded = '';
    while (num > 0) {
        const remainder = num % BigInt(58);
        encoded = alphabet[Number(remainder)] + encoded;
        num = num / BigInt(58);
    }

    // Handle leading zeros
    for (const byte of bytes) {
        if (byte === 0) {
            encoded = '1' + encoded;
        } else {
            break;
        }
    }

    return encoded;
}

readUInt32LE(offset) {
    return (this.rawData[offset] |
        (this.rawData[offset + 1] << 8) |
        (this.rawData[offset + 2] << 16) |
        (this.rawData[offset + 3] << 24)) >>> 0;
}

readUInt32BE(offset) {
    return ((this.rawData[offset] << 24) |
        (this.rawData[offset + 1] << 16) |
        (this.rawData[offset + 2] << 8) |
        this.rawData[offset + 3]) >>> 0;
}

readInt32LE(offset) {
    return this.rawData[offset] |
        (this.rawData[offset + 1] << 8) |
        (this.rawData[offset + 2] << 16) |
        (this.rawData[offset + 3] << 24);
}

readFloat32LE(offset) {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    for (let i = 0; i < 4; i++) {
        view.setUint8(i, this.rawData[offset + i]);
    }
    return view.getFloat32(0, true);
}

readUInt64LE(offset) {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    for (let i = 0; i < 8; i++) {
        view.setUint8(i, this.rawData[offset + i]);
    }
    return view.getBigUint64(0, true);
}

readFloat64LE(offset) {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    for (let i = 0; i < 8; i++) {
        view.setUint8(i, this.rawData[offset + i]);
    }
    return view.getFloat64(0, true);
}

renderSuggestions() {
    const container = document.getElementById('suggestionsList');
    container.innerHTML = '';

    // Filter for high-confidence suggestions only
    const smartSuggestions = this.suggestions.filter(s => s.confidence >= 0.7);

    if (smartSuggestions.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No high-confidence suggestions found</p>';
        return;
    }

    smartSuggestions.sort((a, b) => b.confidence - a.confidence);

    smartSuggestions.forEach((suggestion, index) => {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'flex justify-between items-center p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors';
        suggestionDiv.dataset.suggestionIndex = index;

        let displayValue = suggestion.value;
        let extraInfo = '';

        if (suggestion.lamports) {
            const solAmount = (suggestion.lamports / 1e9).toFixed(2);
            displayValue = `${suggestion.value.substring(0, 8)}...`;

            if (suggestion.accountDetails) {
                extraInfo = `${suggestion.accountDetails.type} • ${solAmount} SOL`;
            } else {
                extraInfo = `${solAmount} SOL`;
            }
        } else if (displayValue.length > 25) {
            displayValue = displayValue.substring(0, 25) + '...';
        }

        // Add confidence indicator
        const confidenceIcon = suggestion.confidence >= 0.9 ? '🔥' : suggestion.confidence >= 0.8 ? '✨' : '💡';

        // Store the original suggestion reference for removal
        const originalIndex = this.suggestions.findIndex(s => 
            s.range[0] === suggestion.range[0] && 
            s.range[1] === suggestion.range[1] && 
            s.type === suggestion.type
        );

        suggestionDiv.innerHTML = `
            <div class="flex-1 min-w-0 relative">
            <div class="absolute top-0 right-0 text-xs text-gray-400 font-mono" style="font-size: 9px; line-height: 1;">
            ${Math.round(suggestion.confidence * 100)}%
            </div>
            <div class="flex items-center gap-2">
            <span class="text-sm">${confidenceIcon}</span>
            <span class="font-medium text-sm text-gray-800">${suggestion.type}</span>
            <span class="text-xs text-gray-500">@${suggestion.range[0]}</span>
            </div>
            <div class="text-xs text-gray-600 truncate">${displayValue}</div>
            ${extraInfo ? `<div class="text-xs text-blue-600 truncate">${extraInfo}</div>` : ''}
            </div>
            <button class="ml-2 text-gray-400 hover:text-red-500 text-sm font-bold transition-colors" 
        onclick="event.stopPropagation(); reverseDataTool.removeSuggestion(${originalIndex})" 
        title="Remove suggestion">
            ×
            </button>
            `;

        suggestionDiv.addEventListener('mouseenter', () => this.highlightRange(suggestion.range[0], suggestion.range[1]));
        suggestionDiv.addEventListener('mouseleave', () => this.unhighlightRange(suggestion.range[0], suggestion.range[1]));
        suggestionDiv.addEventListener('click', () => this.acceptSuggestion(suggestion));

        container.appendChild(suggestionDiv);
    });
}

acceptSuggestion(suggestion) {
    let defaultName = `field_${this.acceptedDecodings.length}`;

    // Suggest a better default name based on account type
    if (suggestion.accountDetails) {
        const accountType = suggestion.accountDetails.type.toLowerCase().replace(/\s+/g, '_');
        defaultName = accountType;
    }

    const name = prompt('Enter a name for this field:', defaultName);
    if (name === null) return;

    for (let i = suggestion.range[0]; i < suggestion.range[1]; i++) {
        this.byteStates[i] = 'decoded';
    }

    let displayValue = suggestion.value;
    if (suggestion.accountDetails) {
        displayValue = `${suggestion.value} (${suggestion.accountDetails.type})`;
    }

    this.acceptedDecodings.push({
        name: name || defaultName,
        type: suggestion.type,
        range: suggestion.range,
        value: displayValue,
        offset: suggestion.range[0],
        accountDetails: suggestion.accountDetails
    });

    // Remove the accepted suggestion from the suggestions list
    const suggestionIndex = this.suggestions.findIndex(s => 
        s.range[0] === suggestion.range[0] && 
        s.range[1] === suggestion.range[1] && 
        s.type === suggestion.type
    );
    if (suggestionIndex > -1) {
        this.suggestions.splice(suggestionIndex, 1);
    }

    this.renderHexdump();
    this.updateAcceptedDecodings();
    this.renderSuggestions(); // Re-render suggestions to remove the accepted one
}

openSolscan(pubkey) {
    window.open(`https://solscan.io/account/${pubkey}`, '_blank');
}

analyzeAccount(pubkey) {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('account', pubkey);
    window.open(currentUrl.toString(), '_blank');
}

removeSuggestion(index) {
    if (index >= 0 && index < this.suggestions.length) {
        this.suggestions.splice(index, 1);
        this.clearAllHighlights();
        this.renderSuggestions();
    }
}

clearAllHighlights() {
    // Remove all yellow highlights from hexdump bytes
    document.querySelectorAll('[data-index]').forEach(el => {
        el.classList.remove('bg-yellow-200', 'ring-2', 'ring-yellow-400');
        // Restore green background if this byte is decoded
        const index = parseInt(el.dataset.index);
        if (this.byteStates[index] === 'decoded') {
            el.classList.add('bg-green-200');
        }
    });

    // Remove all highlights from accepted decodings
    this.unhighlightAllDecodings();
}

loadRpcEndpoints() {
    const savedEndpoint = localStorage.getItem('solanaRpcEndpoint');
    if (savedEndpoint) {
        return [savedEndpoint];
    }
    // No default - user must configure
    return [];
}

loadRpcTimeout() {
    const savedTimeout = localStorage.getItem('rpcTimeout');
    return savedTimeout ? parseInt(savedTimeout) : 5000;
}

loadBatchingEnabled() {
    const savedBatching = localStorage.getItem('enableBatching');
    return savedBatching !== null ? savedBatching === 'true' : false;
}

saveRpcSettings(endpoint, timeout, enableBatching) {
    localStorage.setItem('solanaRpcEndpoint', endpoint);
    localStorage.setItem('rpcTimeout', timeout.toString());
    localStorage.setItem('enableBatching', enableBatching.toString());

    this.solanaRpcUrls = [endpoint];
    this.rpcTimeout = timeout;
    this.enableBatching = enableBatching;

    this.showToast('Settings saved successfully', 'success');
}

initializeSettingsModal() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    const rpcEndpointInput = document.getElementById('rpcEndpoint');

    // Load current settings into inputs
    const currentEndpoint = localStorage.getItem('solanaRpcEndpoint') || '';
    const currentTimeout = localStorage.getItem('rpcTimeout') || '5000';
    const currentBatching = localStorage.getItem('enableBatching') === 'true';

    rpcEndpointInput.value = currentEndpoint;
    document.getElementById('rpcTimeout').value = currentTimeout;
    document.getElementById('enableBatching').checked = currentBatching;

    // Show modal
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
        rpcEndpointInput.focus();
    });

    // Hide modal
    const hideModal = () => {
        settingsModal.classList.add('hidden');
    };

    closeSettingsBtn.addEventListener('click', hideModal);
    cancelSettingsBtn.addEventListener('click', hideModal);

    // Click outside to close
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            hideModal();
        }
    });

    // Save settings
    saveSettingsBtn.addEventListener('click', () => {
        const endpoint = rpcEndpointInput.value.trim();
        const timeout = parseInt(document.getElementById('rpcTimeout').value) || 5000;
        const enableBatching = document.getElementById('enableBatching').checked;

        if (!endpoint) {
            this.showToast('Please enter an RPC endpoint', 'error');
            return;
        }

        // Basic URL validation
        try {
            new URL(endpoint);
        } catch (error) {
            this.showToast('Please enter a valid URL', 'error');
            return;
        }

        // Validate timeout
        if (timeout < 1000 || timeout > 30000) {
            this.showToast('Timeout must be between 1000 and 30000ms', 'error');
            return;
        }

        this.saveRpcSettings(endpoint, timeout, enableBatching);
        hideModal();
    });

    // Clear cache button
    clearCacheBtn.addEventListener('click', () => {
        this.clearAccountCache();
    });

    // Enter key to save
    rpcEndpointInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveSettingsBtn.click();
        }
    });
}

checkFirstTimeSetup() {
    const hasRpcEndpoint = localStorage.getItem('solanaRpcEndpoint');

    if (!hasRpcEndpoint) {
        // Show first-time setup modal
        const setupModal = document.getElementById('setupModal');
        const completeSetupBtn = document.getElementById('completeSetupBtn');
        const setupRpcEndpoint = document.getElementById('setupRpcEndpoint');
        const setupRpcTimeout = document.getElementById('setupRpcTimeout');
        const setupEnableBatching = document.getElementById('setupEnableBatching');

        setupModal.classList.remove('hidden');
        setupRpcEndpoint.focus();

        // Default to public endpoint in the input
        setupRpcEndpoint.value = 'https://api.mainnet-beta.solana.com';

        completeSetupBtn.addEventListener('click', () => {
            const endpoint = setupRpcEndpoint.value.trim();
            const timeout = parseInt(setupRpcTimeout.value) || 5000;
            const enableBatching = setupEnableBatching.checked;

            if (!endpoint) {
                this.showToast('Please enter an RPC endpoint', 'error');
                return;
            }

            try {
                new URL(endpoint);
            } catch (error) {
                this.showToast('Please enter a valid URL', 'error');
                return;
            }

            if (timeout < 1000 || timeout > 30000) {
                this.showToast('Timeout must be between 1000 and 30000ms', 'error');
                return;
            }

            this.saveRpcSettings(endpoint, timeout, enableBatching);
            setupModal.classList.add('hidden');

            this.showToast('Setup complete! You can now analyze Solana data.', 'success', 4000);
        });

        // Enter key to complete setup
        [setupRpcEndpoint, setupRpcTimeout].forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    completeSetupBtn.click();
                }
            });
        });
    }
}

async checkPubkeyExists(pubkey, interpretation) {
    try {
        // Check if we have RPC configured
        if (this.solanaRpcUrls.length === 0) {
            interpretation.value = `${pubkey} (configure RPC to check)`;
            interpretation.isChecking = false;
            this.updateSelectionDecode();
            return;
        }

        const rpcUrl = this.solanaRpcUrls[0];
        const requestBody = {
            jsonrpc: '2.0',
            id: 'check_pubkey',
            method: 'getAccountInfo',
            params: [pubkey, { encoding: 'base64' }]
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.rpcTimeout);

        const response = await fetch(rpcUrl, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            this.handleRpcError(response.status, 'checkPubkeyExists');
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            // Account doesn't exist or other error
            interpretation.value = `${pubkey} (empty account)`;
        } else if (data.result && data.result.value) {
            // Account exists
            const accountInfo = data.result.value;
            const lamports = accountInfo.lamports;
            const solAmount = (lamports / 1e9).toFixed(4);
            const ownerProgram = this.knownPrograms[accountInfo.owner] || 'Unknown Program';

            interpretation.value = `${pubkey} (${solAmount} SOL, ${ownerProgram})`;
            interpretation.accountExists = true;
            interpretation.accountInfo = accountInfo;
        } else {
            // Account doesn't exist
            interpretation.value = `${pubkey} (empty account)`;
        }

    } catch (error) {
        // On error, just show as empty account
        interpretation.value = `${pubkey} (empty account)`;
    } finally {
        interpretation.isChecking = false;
        this.updatePubkeyInterpretation(interpretation);
    }
}

updatePubkeyInterpretation(interpretation) {
    // Find the specific interpretation item in the DOM and update only its content
    const container = document.getElementById('selectionDecodeList');
    const items = container.querySelectorAll('.flex.justify-between.items-center');
    
    items.forEach(item => {
        const typeSpan = item.querySelector('.text-sm.font-medium');
        if (typeSpan && typeSpan.textContent === 'Solana Pubkey') {
            const valueSpan = item.querySelector('.text-xs.text-gray-600.font-mono.break-all');
            if (valueSpan) {
                valueSpan.textContent = interpretation.value;
                
                // Update click handler with new interpretation data
                const newItem = item.cloneNode(true);
                newItem.addEventListener('click', () => this.acceptSelectionDecode(interpretation));
                item.parentNode.replaceChild(newItem, item);
            }
        }
    });
}

handleRpcError(statusCode, context) {
    let message = '';
    let type = 'error';

    switch (statusCode) {
        case 401:
            message = 'RPC Authentication failed. Your endpoint may not support batched requests - try disabling batching in settings.';
            type = 'warning';
            break;
        case 429:
            message = 'Rate limit exceeded. Too many requests to RPC endpoint. Try increasing timeout or using a different endpoint.';
            type = 'warning';
            break;
        case 403:
            message = 'RPC access forbidden. Check your API key or endpoint permissions.';
            break;
        case 500:
            message = 'RPC server error. The endpoint may be experiencing issues.';
            break;
        case 502:
        case 503:
        case 504:
            message = 'RPC endpoint unavailable. Try using a different endpoint.';
            break;
        default:
            message = `RPC request failed with status ${statusCode}`;
    }

    this.showToast(message, type);
}

isMaxConfidenceByte(index) {
    return this.suggestions.some(suggestion => 
        suggestion.isMaxConfidence && 
        index >= suggestion.range[0] && 
        index < suggestion.range[1]
    );
}

highlightMaxConfidenceSuggestions() {
    // Re-render hexdump to apply max confidence highlighting
    this.renderHexdump();
}

acceptMaxConfidenceSuggestion(clickedIndex) {
    // Find the max confidence suggestion that contains this byte
    const suggestion = this.suggestions.find(s => 
        s.isMaxConfidence && 
        clickedIndex >= s.range[0] && 
        clickedIndex < s.range[1]
    );

    if (suggestion) {
        this.acceptSuggestion(suggestion);
    }
}
}

let reverseDataTool;

document.addEventListener('DOMContentLoaded', () => {
    reverseDataTool = new ReverseDataTool();

    // Check URL parameters after DOM and tool are ready
    reverseDataTool.checkUrlParameters();
});
