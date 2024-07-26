module.exports = {
    apps : [{
        name: "Xreacher-API",
        script: "/root/apps/Xreacher/backend-api/index.js",
        // cluster
        instances: "max",
        exec_mode: "cluster",
        watch: false,
        autorestart: false, // Disable auto-restart
        env: {
            NODE_ENV: "development",
        },
        env_production: {
            NODE_ENV: "production",
        },
        log_file: "/root/apps/Xreacher/backend-api/logs/combined-log.log",
        error_file: "/root/apps/Xreacher/backend-api/logs/error.log",
        out_file: "/root/apps/Xreacher/backend-api/logs/out.log",
    }]
}