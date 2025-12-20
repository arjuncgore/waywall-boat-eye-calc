import utilRoutes from "./routeUtils.js";

const constructorMethod = (app) => {
    // Homepage
    app.use('/', utilRoutes);

    // Invalid Page
    app.use((req, res) => {
        res.status(404).send("Invalid Page");
    });
};

export default constructorMethod;
