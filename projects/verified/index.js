/**{
 * Defi Adapter for Verified that gets TVLs for both primary and secondary manager contracts
 * on Polygon, Georli and Gnosis chain/network.
 * } **/

//import defillma sdk
const sdk = require("@defillama/sdk");
//import prewritten getLogs from helper
const { getLogs } = require("../helper/cache/getLogs");

//configuration showcasing chainlist with address and fromBlocks(block to start reading logs from)
//for each chain
const chainConfig = {
  //Default contract creation block as seen on POLYGON explorer
  //primary: 39620319
  //secondary: 42569294
  polygon: {
    primary: {
      address: "0xDA13BC71FEe08FfD523f10458B0e2c2D8427BBD5",
      fromBlock: 48018079,
    },
    secondary: {
      address: "0xbe7a3D193d91D1F735d14ec8807F20FF2058f342",
      fromBlock: 48018079,
    },
  },
  //Default contract creation block as seen on GOERLI explorer
  //primary: 9358946
  //secondary: 9358950
  goerli: {
    primary: {
      address: "0x63D95635938857Ad202f0684dfd91dc71C9d111e",
      fromBlock: 9602232,
    },
    secondary: {
      address: "0xe1f45e7104069F998b919C26435c4aaBAeD68fEd",
      fromBlock: 9602232,
    },
  },
  //Default contract creation block as seen on GNOSIS explorer
  //primary: 27841697
  //secondary: 27841770
  //   gnosis: {
  //     primary: {
  //       address: "0xe5459436AE26C4fDC77f51c459e9Aa08b5d32064",
  //       fromBlock: 30181663,
  //     },
  //     secondary: {
  //       address: "0xB1ae3Fc5B16d3736bf0db20606fB9a10b435392c",
  //       fromBlock: 30181663,
  //     },
  //   },
};

//sums up and return the total of all array hex elements in decimal(human readable number)
const sumTvls = (tvls) => {
  return tvls.reduce((a, b) => {
    return Number(a) + Number(b);
  }, 0x0);
};

//gets primaryManagerTvl can be used for any manager contract that emits
//event topic: 0x03e4d401f7446bde326c5951f40797b975fbe06e73f36b2a41646ea680cc40f2
const getChainTvls = (chain) => {
  let primaryTvls = [];
  let secondaryTvls = [];
  return async (_, _1, _2, { api }) => {
    const primaryLogs = await getLogs({
      api,
      target: chainConfig[chain].primary.address,
      topic:
        "subscribers(address,bytes32,address,address,uint256,uint256,uint256,bool)",
      //   topics: [
      //     "0x03e4d401f7446bde326c5951f40797b975fbe06e73f36b2a41646ea680cc40f2",
      //   ],
      fromBlock: chainConfig[chain].primary.fromBlock,
      eventAbi:
        "event subscribers(address indexed security, bytes32 poolId, address investor, address currency, uint256 cashSwapped, uint256 securitySwapped, uint256 timestamp, bool subscription)",
      onlyArgs: true,
    });
    const secondaryLogs = await getLogs({
      api,
      target: chainConfig[chain].secondary.address,
      topic:
        "subscribers(bytes32,address,address,address,address,uint256,uint256,bytes32,bytes32,uint256)",
      fromBlock: chainConfig[chain].secondary.fromBlock,
      eventAbi:
        "event subscribers(bytes32 poolId, address seller, address investor, address indexed securityTraded, address currencySettled, uint256 amount, uint256 price, bytes32 tradeRef, bytes32 DPID, uint256 timestamp)",
      onlyArgs: true,
    });
    if (primaryLogs.length > 0) {
      primaryTvls = primaryLogs.map((i) => i.cashSwapped).flat();
    }
    const totalPrimaryTvl = sumTvls(primaryTvls);
    if (secondaryLogs.length > 0) {
      secondaryTvls = secondaryLogs.map((i) => i.amount).flat();
    }
    const totalSecondaryTvl = sumTvls(secondaryTvls);
    //customise log
    sdk.log(
      "Tvl details for",
      chain,
      "network: {primary manager tvl: ",
      totalPrimaryTvl,
      " secondary manager tvl: ",
      totalSecondaryTvl,
      " }"
    );
    //no need for sumTokens2 since we can get total Tvl from logs
    //we don't need balance of any token according to the task assingment
    return [totalPrimaryTvl, totalSecondaryTvl];
  };
};

module.exports = {};

Object.keys(chainConfig).forEach((chain) => {
  module.exports[chain] = {
    tvl: getChainTvls(chain),
  };
});
