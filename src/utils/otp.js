module.exports = () => {
    if (process.env.NODE_ENV !== 'production') {
        return 123456;
    }

    return Math.floor(100000 + Math.random() * 900000);
};
