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
const UNLOCK_TIME = 1710338400
const VESTING_SCHEDULE = {
  when: [
    1710338400, //03/13/2024 14:00:00 UTC
    1713016800, //04/13/2024 14:00:00 UTC
    1715608800, //05/13/2024 14:00:00 UTC
    1718287200, //06/13/2024 14:00:00 UTC
    1720879200, //07/13/2024 14:00:00 UTC
    1723557600, //08/13/2024 14:00:00 UTC
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
    1852466400, //09/13/2028 14:00:00 UTC
    1855058400, //10/13/2028 14:00:00 UTC
    1857736800, //11/13/2028 14:00:00 UTC
    1860328800, //12/13/2028 14:00:00 UTC
    1863007200, //01/13/2029 14:00:00 UTC
    1865685600, //02/13/2029 14:00:00 UTC
    1868104800, //03/13/2029 14:00:00 UTC
    1870783200, //04/13/2029 14:00:00 UTC
    1873375200, //05/13/2029 14:00:00 UTC
    1876053600, //06/13/2029 14:00:00 UTC
    1878645600, //07/13/2029 14:00:00 UTC
    1881324000, //08/13/2029 14:00:00 UTC
    1884002400, //09/13/2029 14:00:00 UTC
    1886594400, //10/13/2029 14:00:00 UTC
    1889272800, //11/13/2029 14:00:00 UTC
    1891864800, //12/13/2029 14:00:00 UTC
    1894543200, //01/13/2030 14:00:00 UTC
    1897221600, //02/13/2030 14:00:00 UTC
    1899640800, //03/13/2030 14:00:00 UTC
    1902319200, //04/13/2030 14:00:00 UTC
    1904911200, //05/13/2030 14:00:00 UTC
    1907589600, //06/13/2030 14:00:00 UTC
    1910181600, //07/13/2030 14:00:00 UTC
    1912860000, //08/13/2030 14:00:00 UTC
    1915538400, //09/13/2030 14:00:00 UTC
    1918130400, //10/13/2030 14:00:00 UTC
    1920808800, //11/13/2030 14:00:00 UTC
    1923400800, //12/13/2030 14:00:00 UTC
    1926079200, //01/13/2031 14:00:00 UTC
    1928757600, //02/13/2031 14:00:00 UTC
    1931176800, //03/13/2031 14:00:00 UTC
    1933855200, //04/13/2031 14:00:00 UTC
    1936447200, //05/13/2031 14:00:00 UTC
    1939125600, //06/13/2031 14:00:00 UTC
    1941717600, //07/13/2031 14:00:00 UTC
    1944396000, //08/13/2031 14:00:00 UTC
    1947074400, //09/13/2031 14:00:00 UTC
    1949666400, //10/13/2031 14:00:00 UTC
    1952344800, //11/13/2031 14:00:00 UTC
    1954936800, //12/13/2031 14:00:00 UTC
    1957615200, //01/13/2032 14:00:00 UTC
    1960293600, //02/13/2032 14:00:00 UTC
    1962799200, //03/13/2032 14:00:00 UTC
    1965477600, //04/13/2032 14:00:00 UTC
    1968069600, //05/13/2032 14:00:00 UTC
    1970748000, //06/13/2032 14:00:00 UTC
    1973340000, //07/13/2032 14:00:00 UTC
    1976018400, //08/13/2032 14:00:00 UTC
    1978696800, //09/13/2032 14:00:00 UTC
    1981288800, //10/13/2032 14:00:00 UTC
    1983967200, //11/13/2032 14:00:00 UTC
    1986559200, //12/13/2032 14:00:00 UTC
    1989237600, //01/13/2033 14:00:00 UTC
    1991916000, //02/13/2033 14:00:00 UTC
  ],
  amount: [
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666738)),
  ]
}

const GFAL_TOKEN = process.env.GFAL_TOKEN_MAINNET

async function main() {
  const vester = new ethers.Wallet(process.env.VESTER_PRIVATE_KEY_MAINNET)

  const VestingBasic = await hre.ethers.getContractFactory("VestingBasic")
  const vestingBasic = await VestingBasic.deploy(GFAL_TOKEN, "0x43fe03F49ec5c2575137F4AEeaf63EbB39F59955", UNLOCK_TIME)

  await vestingBasic.deployed()

  // Executing functions

  await vestingBasic.grantRole(VESTER_ROLE, vester.address)

  let vestingExecutions = DeployVestingUtils.splitVestingSchedule(VESTING_SCHEDULE.when, VESTING_SCHEDULE.amount)
  // Iterate through each batch and call setVestingSchedules() function
  for (let i = 0; i < vestingExecutions.length; i++) {
    await vestingBasic.setVestingSchedule(vestingExecutions[i].when, vestingExecutions[i].amount)
  }

  console.log(
    `VestingBasic "Team" allocation deployed to ${vestingBasic.address}`
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
