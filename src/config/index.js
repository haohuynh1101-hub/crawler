module.exports = {
    PORT: "3000",
    SECRET: "marketing_seo_secret",
    SESSION: {
        name: 'session_marketing_seo',
        proxy: true,
        resave: true,
        secret: "session_marketing_seo.secrect", // session secret
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: false /*Use 'true' without setting up HTTPS will result in redirect errors*/,
        }
    },
    DEBUG: {
        server: "marketing_seo"
    }
}