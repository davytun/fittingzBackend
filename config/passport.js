const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in .env file. Passport JWT strategy cannot be set up.");
    // Potentially throw an error or exit if JWT_SECRET is crucial for startup
    // For now, this will cause passport.use to not be called with a valid strategy if JWT_SECRET is missing.
}

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET,
};

const initializePassport = () => {
    if (!JWT_SECRET) {
        console.warn("Passport JWT Strategy not initialized due to missing JWT_SECRET.");
        return; // Do not initialize if secret is missing
    }

    passport.use(
        new JwtStrategy(options, async (jwt_payload, done) => {
            try {
                // We are storing admin id and email in the payload
                // We can find the admin based on the id
                const admin = await prisma.admin.findUnique({
                    where: { id: jwt_payload.id },
                });

                if (admin) {
                    // If admin is found, return null for error and the admin object
                    return done(null, admin);
                } else {
                    // If admin is not found, return false for user
                    return done(null, false);
                    // Or you could create a new error for "user not found"
                    // return done(new Error('User not found'), false);
                }
            } catch (error) {
                return done(error, false);
            }
        })
    );
    console.log("Passport JWT strategy initialized.");
};

module.exports = initializePassport;
