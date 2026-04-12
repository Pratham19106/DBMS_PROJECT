const optimizePurchase = async (req, res, next) => {
    try {
        return res.status(501).json({
            msg: 'Purchase optimization endpoint is not implemented yet'
        })
    } catch (error) {
        return next(error)
    }
}

module.exports = { optimizePurchase }