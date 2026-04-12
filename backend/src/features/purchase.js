const optimizePurchaseLogic = (vendorList = []) => {
    if (!Array.isArray(vendorList)) {
        throw new Error('vendorList must be an array')
    }

    return vendorList
}

module.exports = { optimizePurchaseLogic }