const functions = require('firebase-functions');

const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();

const cors = require('cors')({ origin : true });


/**
 *
 * GET RESTAURANT MENU
 *
 * @type {HttpsFunction}
 */
exports.getRestaurant =  functions.https.onRequest(async (request, response) => {


    let query = request.query;

    const CUSTOMER_ID = query.customerId;

    cors( request, response, async () => {

        let restaurant = await db.doc(`/customers/${CUSTOMER_ID}`).get().then(snapshot => snapshot.data().restaurantName);

        let customerStripePublicKey = await db.doc(`/customers/${CUSTOMER_ID}`).get().then(snapshot => snapshot.data().stripePK);

        let menu = await db.doc(`/customers/${CUSTOMER_ID}`).get().then(snapshot => snapshot.data().menu);

        let menuCategories = await db.doc(`/customers/${CUSTOMER_ID}`).get().then(snapshot => snapshot.data().menuCategories);

        let restaurantInfo = await db.doc(`/customers/${CUSTOMER_ID}`).get().then(snapshot => snapshot.data().restaurantInfo);

        response.json({restaurant, menu, menuCategories, customerStripePublicKey, restaurantInfo});

    })

});




/**
 *
 * STRIPE PAYMENT CARD
 *
 * @type {HttpsFunction}
 */
exports.stripeIntents = functions.https.onRequest( async ( request, response) => {

    let query = request.query;

    const CUSTOMER_ID = query.customerId;


    /**
     *
     * CHECK ORDER AND CALCULATE AMOUNT TO PAY
     *
     */

    let total = 0;


    cors( request, response, async () => {


        const order = request.body;


        let menu = await db.doc(`/customers/${CUSTOMER_ID}`).get().then( snapshot => snapshot.data().menu );

        /**
         * GET CUSTOMER's STRIPE SECRET KEY FROM THE DB
         * @param  String!  customerId
         *
         * @return String! Restaurant Stripe Secret Key
         */
        let customerStripeSK = await db.doc(`/customers/${CUSTOMER_ID}`).get().then( snapshot => snapshot.data().stripeSK );


        // CALCULATES THE TOTAL TO PAY
        // QUERY THE MENU SO WE MAKE SURE THAT WE ARE CHARGING THE RIGHT AMOUNT
        order.orderItems.forEach( item => {

            let productsInTheOrder = menu.find( product => {

                return product.id == item.id

            });

            //  total = total + price + toppings price * quantity
            total = total + (productsInTheOrder.price_in_cents + (item.toppings.length * 100)) * item.amount


        })




        // PROCESS THE PAYMENT VIE STRIPE
        const stripe = require('stripe')(customerStripeSK);

        (async () => {

            const paymentIntent = await stripe.paymentIntents.create({

                amount: total,

                currency: 'BRL',

                payment_method_types: ['card'],

                capture_method: 'manual',

            });

            // SEND THE TOKEN TO THE CLIENT SO STRIPE CAN PROCEED WITH THE CHARGING
            // response.json({ paymentIntent: paymentIntent.client_secret})
            response.json({ paymentIntent: paymentIntent})

        })()


    });


})


/**
 *
 * STRIPE PAYMENT CARD CAPTURE
 *
 * @type {HttpsFunction}
 */
exports.stripeIntentsCapture = functions.https.onRequest( async ( request, response) => {

    let query = request.query;

    const CUSTOMER_ID = query.customerId;

    const PAYMENT_ID = query.paymentId;


    cors( request, response, async () => {

         /**
         * GET CUSTOMER's STRIPE SECRETE KEY FROM THE DB
         * @param  String!  customerId
         *
         * @return String! Restaurant Stripe Secret Key
         */
        let customerStripeSK = await db.doc(`/customers/${CUSTOMER_ID}`).get().then( snapshot => snapshot.data().stripeSK );


        // PROCESS THE PAYMENT VIE STRIPE
        const stripe = require('stripe')(customerStripeSK);

        (async () => {

            const paymentIntent = await stripe.paymentIntents.capture(PAYMENT_ID)

            // SEND THE TOKEN TO THE CLIENT SO STRIPE CAN PROCEED WITH THE CHARGING
            // response.json({ paymentIntent: paymentIntent.client_secret})
            response.json(paymentIntent)

        })()


    });


})



/**
 *
 * STRIPE PAYMENT CARD CANCEL
 *
 * @type {HttpsFunction}
 */
exports.stripeIntentsCancel = functions.https.onRequest( async ( request, response) => {

    let query = request.query;

    const CUSTOMER_ID = query.customerId;

    const PAYMENT_ID = query.paymentId;

    cors( request, response, async () => {


        /**
         * GET CUSTOMER's STRIPE SECRETE KEY FROM THE DB
         * @param  String!  customerId
         *
         * @return String! Restaurant Stripe Secret Key
         */
        let customerStripeSK = await db.doc(`/customers/${CUSTOMER_ID}`).get().then( snapshot => snapshot.data().stripeSK );



        // PROCESS THE PAYMENT VIE STRIPE
        const stripe = require('stripe')(customerStripeSK);

        (async () => {

            const paymentIntent = await stripe.paymentIntents.cancel(PAYMENT_ID)

            // SEND THE TOKEN TO THE CLIENT SO STRIPE CAN PROCEED WITH THE CHARGING
            // response.json({ paymentIntent: paymentIntent.client_secret})
            response.json(paymentIntent)

        })()


    });


})



/**
 *
 * SEND RATING TO FLAVY
 *
 * @type {HttpsFunction}
 */
exports.submitFavyAppRating = functions.https.onRequest( async ( request, response) =>{

    cors( request, response, () => {

        const rating = request.body;

        return db.collection("flavyAnalytics").doc("rating").update({

            rating: admin.firestore.FieldValue.arrayUnion(rating)

        }).then(() => {

            response.status(200).end();

        });


    })

});


/**
 *
 * GET RESTAURANT ORDERS
 *
 * @type {HttpsFunction}
 */
exports.getRestaurantOrders =  functions.https.onRequest(async (request, response) => {


    let query = request.query;

    const CUSTOMER_ID = query.customerId;

    cors( request, response, async () => {

        let orders = await db.doc(`/customers/${CUSTOMER_ID}`).get().then(snapshot => snapshot.data().orders);


        // Make sure we only show open orders
        let openOrders = orders.filter( order => {

            return order.orderStatus === "ordered"; // can be ordered || accepted. Accepted orders means the waiter sent the order to the kitchen already.

        });

        response.json(openOrders);

    })

});




/**
 *
 * GET RESTAURANT BY LOGGED IN USER ADMIN
 *
 * @type {HttpsFunction}
 *
 * todo: improve it by not getting the id generated by firebase instead of having to add manualy it to the document
 */
exports.getRestaurantByAdmin =  functions.https.onRequest(async (request, response) => {

    let query = request.query;

    const USER_EMAIL = query.user;

    cors( request, response, async () => {

        let restaurants = await db.collection("customers").get()

        let rest = restaurants.docs.map(doc => doc.data())

        const RESTAURANT_BY_USER = rest.find( restaurant => {

            return restaurant.admin == USER_EMAIL

        });


        response.json({
            restaurantId: RESTAURANT_BY_USER.restaurantId,
            restaurantInfo: RESTAURANT_BY_USER.restaurantInfo,
            restaurantName: RESTAURANT_BY_USER.restaurantName,
            restaurantMenu: RESTAURANT_BY_USER.menu,
            menuCategories: RESTAURANT_BY_USER.menuCategories
        });

    })

});



/**
 *
 * SEND ORDER TO FIRESTORE
 *
 * @type {HttpsFunction}
 *
 *
 */
exports.sendOrderToFirebase =  functions.https.onRequest(async (request, response) => {

    let query = request.query;

    const CUSTOMER_ID = query.customerId;

    const PAYMENT_METHOD = query.paymentMethod;

    cors( request, response, async () => {

        const order = request.body;

        const {orderId, orderItems, date, paymentIntentID, order_total_in_cents, tableNumber, pnToken } = order;

        return db.collection("customers").doc(CUSTOMER_ID).update({

            orders: admin.firestore.FieldValue.arrayUnion({
                orderId: orderId,
                tableNumber: tableNumber,
                paymentStatus: 'pending',
                paymentIntentID: paymentIntentID,
                paymentMethod: PAYMENT_METHOD,
                PN_TOKEN: pnToken,
                orderStatus: "ordered",
                date: date,
                delivered: false,
                order_total_in_cents: order_total_in_cents,
                orderItems: orderItems
            })

        }).then(() => {

            response.status(200).end();

        });


    })

});
