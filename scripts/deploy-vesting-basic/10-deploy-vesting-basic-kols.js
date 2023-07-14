// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat")
const {ethers} = require("hardhat");
const DeployVestingUtils = require("../utils/deploy-vesting-utils");

// Constants
const VESTER_ROLE = "0x64ed6499e2f5a7ea55dfd56da361bf9d48064843bb3891c36f1dabd9ba246135"
const UNLOCK_TIME = 1681394400
const VESTING_SCHEDULE = {
  when: [
    1681394400, //04/13/2023 14:00:00 UTC
    1683986400, //05/13/2023 14:00:00 UTC
    1686664800, //06/13/2023 14:00:00 UTC
    1689256800, //07/13/2023 14:00:00 UTC
    1691935200, //08/13/2023 14:00:00 UTC
    1694613600, //09/13/2023 14:00:00 UTC
  ],
  amount: [
    ethers.utils.parseEther(String(7083333)),
    ethers.utils.parseEther(String(7083333)),
    ethers.utils.parseEther(String(7083333)),
    ethers.utils.parseEther(String(7083333)),
    ethers.utils.parseEther(String(7083333)),
    ethers.utils.parseEther(String(7083335)),
  ]
}

const GFAL_TOKEN = process.env.GFAL_TOKEN_MAINNET

async function main() {
  const vester = new ethers.Wallet(process.env.VESTER_PRIVATE_KEY_MAINNET)

  const VestingBasic = await hre.ethers.getContractFactory("VestingBasic")
  const vestingBasic = await VestingBasic.deploy(GFAL_TOKEN, "0x44e1a2dC8F2b00121420806840fd469Ed7568fcD", UNLOCK_TIME)

  await vestingBasic.deployed()

  // Executing functions

  await vestingBasic.grantRole(VESTER_ROLE, vester.address)

  let vestingExecutions = DeployVestingUtils.splitVestingSchedule(VESTING_SCHEDULE.when, VESTING_SCHEDULE.amount)
  // Iterate through each batch and call setVestingSchedules() function
  for (let i = 0; i < vestingExecutions.length; i++) {
    await vestingBasic.setVestingSchedule(vestingExecutions[i].when, vestingExecutions[i].amount)
  }

  console.log(
    `VestingBasic "KOLS" allocation deployed to ${vestingBasic.address}`
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
