const DeployVestingUtils = {
  splitVestingSchedule(when, amount) {
    let vestingExecutions = []
    let batchSize = 25
    for (let i = 0; i < when.length; i += batchSize) {
      let batch = {
        when: when.slice(i, i + batchSize),
        amount: amount.slice(i, i + batchSize)
      }
      vestingExecutions.push(batch)
    }
    return vestingExecutions
  }
}

module.exports = DeployVestingUtils