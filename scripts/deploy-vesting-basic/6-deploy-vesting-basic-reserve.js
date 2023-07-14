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
const UNLOCK_TIME = 1726236000
const VESTING_SCHEDULE = {
  when: [
    1726236000, //09/13/2024 14:00:00 UTC
    1728828000, //10/13/2024 14:00:00 UTC
    1731506400, //11/13/2024 14:00:00 UTC
    1734098400, //12/13/2024 14:00:00 UTC
    1736776800, //01/13/2025 14:00:00 UTC
    1739455200, //02/13/2025 14:00:00 UTC
    1741874400, //03/13/2025 14:00:00 UTC
    1744552800, //04/13/2025 14:00:00 UTC
    1747144800, //05/13/2025 14:00:00 UTC
    1749823200, //06/13/2025 14:00:00 UTC
    1752415200, //07/13/2025 14:00:00 UTC
    1755093600, //08/13/2025 14:00:00 UTC
    1757772000, //09/13/2025 14:00:00 UTC
    1760364000, //10/13/2025 14:00:00 UTC
    1763042400, //11/13/2025 14:00:00 UTC
    1765634400, //12/13/2025 14:00:00 UTC
    1768312800, //01/13/2026 14:00:00 UTC
    1770991200, //02/13/2026 14:00:00 UTC
    1773410400, //03/13/2026 14:00:00 UTC
    1776088800, //04/13/2026 14:00:00 UTC
    1778680800, //05/13/2026 14:00:00 UTC
    1781359200, //06/13/2026 14:00:00 UTC
    1783951200, //07/13/2026 14:00:00 UTC
    1786629600, //08/13/2026 14:00:00 UTC
    1789308000, //09/13/2026 14:00:00 UTC
    1791900000, //10/13/2026 14:00:00 UTC
    1794578400, //11/13/2026 14:00:00 UTC
    1797170400, //12/13/2026 14:00:00 UTC
    1799848800, //01/13/2027 14:00:00 UTC
    1802527200, //02/13/2027 14:00:00 UTC
    1804946400, //03/13/2027 14:00:00 UTC
    1807624800, //04/13/2027 14:00:00 UTC
    1810216800, //05/13/2027 14:00:00 UTC
    1812895200, //06/13/2027 14:00:00 UTC
    1815487200, //07/13/2027 14:00:00 UTC
    1818165600, //08/13/2027 14:00:00 UTC
    1820844000, //09/13/2027 14:00:00 UTC
    1823436000, //10/13/2027 14:00:00 UTC
    1826114400, //11/13/2027 14:00:00 UTC
    1828706400, //12/13/2027 14:00:00 UTC
    1831384800, //01/13/2028 14:00:00 UTC
    1834063200, //02/13/2028 14:00:00 UTC
    1836568800, //03/13/2028 14:00:00 UTC
    1839247200, //04/13/2028 14:00:00 UTC
    1841839200, //05/13/2028 14:00:00 UTC
    1844517600, //06/13/2028 14:00:00 UTC
    1847109600, //07/13/2028 14:00:00 UTC
    1849788000, //08/13/2028 14:00:00 UTC
  ],
  amount: [
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833333)),
    ethers.utils.parseEther(String(20833349)),
  ]
}

const GFAL_TOKEN = process.env.GFAL_TOKEN_MAINNET

async function main() {
  const vester = new ethers.Wallet(process.env.VESTER_PRIVATE_KEY_MAINNET)

  const VestingBasic = await hre.ethers.getContractFactory("VestingBasic")
  const vestingBasic = await VestingBasic.deploy(GFAL_TOKEN, "0x202813F8b64B14062005973b793c5BC86DE9FF21", UNLOCK_TIME)

  await vestingBasic.deployed()

  // Executing functions

  await vestingBasic.grantRole(VESTER_ROLE, vester.address)

  let vestingExecutions = DeployVestingUtils.splitVestingSchedule(VESTING_SCHEDULE.when, VESTING_SCHEDULE.amount)
  // Iterate through each batch and call setVestingSchedules() function
  for (let i = 0; i < vestingExecutions.length; i++) {
    await vestingBasic.setVestingSchedule(vestingExecutions[i].when, vestingExecutions[i].amount)
  }

  console.log(
    `VestingBasic "Reserve" allocation deployed to ${vestingBasic.address}`
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
