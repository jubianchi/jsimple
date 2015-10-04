module.exports = {
    port: 3000,
    static: {
        directory: __dirname + "/../../docs",
        url: "/docs"
    },
    logger: {
        format: "combined"
    }
};
