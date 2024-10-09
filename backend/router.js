var express = require('express');
var app = express();
var path = require('path');
var router = express.Router();
var port = 5001;
var mysql = require("mysql");
var bodyParser = require('body-parser');
const bcrypt = require ('bcrypt');
var session = require('express-session');

app.use(session({
    secret: 'secret-key', // คีย์เพื่อใช้ในการเข้ารหัส session ที่เก็บไว้ (สามารถกำหนดเป็นอะไรก็ได้)
    resave: false,
    saveUninitialized: true
}));

// ตั้งค่า view engine เป็น EJS
app.set('view engine', 'ejs');

// กำหนดไดเรกทอรีของไฟล์ views
app.set('views', path.join(__dirname, '../frontend/views'));
// รับค่าจากฝั่งuserผ่านbody req
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Setup MySQL connection
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'st66x01',
    password: 'MySQL.213',
    database: 'st66x01db'
});

conn.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database.');
});

//อ่านค่าาไฟล์frontend
app.use(express.static(path.join(__dirname, '/../frontend')));

// เส้นทางสำหรับการลงทะเบียนผู้ใช้ใหม่
router.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/../frontend/register.html'));
});

router.post('/signup', async function (req, res) {
    const { fn, ln, phone, email, pwd } = req.body;

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(pwd, salt);

        const sql = "INSERT INTO users (firstname, lastname, phone, email, password) VALUES (?, ?, ?, ?, ?)";
        const values = [fn, ln, phone, email, hashedPassword];

        conn.query(sql, values, (error, results) => {
           if (error) {
                console.error('Error inserting user:', error);
                res.status(500).send('Internal Server Error');
                return;
            }
            res.sendFile(path.join(__dirname + '/../frontend/login.html'));
        });
    }catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).send('Internal Server Error');
    }
});

// เส้นทางสำหรับการล็อกอิน
router.post('/login', async (req, res) => {
    const { email, pwd } = req.body;

    try {
        const sql = "SELECT * FROM users WHERE email = ?";
        const values = [email];

        conn.query(sql, values, async (error, results) => {
            if (error) {
                console.error('Error querying user:', error);
                res.status(500).send('Internal Server Error');
                return;
            }

            if (results.length === 0) {
                res.status(401).send('Invalid email or password');
                return;
            }

            const user = results[0];
            const hashedPassword = user.password;

            // เทียบPasswordตอน bcrypt
            const passwordMatch = await bcrypt.compare(pwd, hashedPassword);

            if (!passwordMatch) {
                res.status(401).send('Invalid email or password');
                return;
            }

            req.session.userId = user.user_id; // เก็บ session ยืนยันตัวตน
            console.log('LOGIN SUCCESS', user);

            
            res.render('profile', { user: user });
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Internal Server Error');
    }
});


// เส้นทางสำหรับการดูโปรไฟล์ผู้ใช้
router.get('/profile', (req, res) => {
    const userId = req.session.userId;
    const sql = 'SELECT * FROM users WHERE user_id = ?';

    conn.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        if (results.length === 0) {
            // res.redirect('/profile');
            res.status(404).send('User not found');
            return;
        }

        // ส่งข้อมูลโปรไฟล์ไปยัง view profile.ejs
        res.render('profile', { user: results[0] });
    });
});


router.post('/updateProfile/:id', async (req, res) => {
    const userId = req.session.userId; 
    const { firstname, lastname, email, phone, password } = req.body;

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const sql = 'UPDATE users SET firstname = ?, lastname = ?, email = ?, phone = ?, password = ? WHERE user_id = ?';

        conn.query(sql, [firstname, lastname, email, phone, hashedPassword, userId], (err) => {
            if (err) {
                console.error('Error executing query:', err);
                res.status(500).send('Internal Server Error');
                return;
            }

            res.redirect('/profile');
        });
    } catch (err) {
        console.error('Error hashing password:', err);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/deleteProfile/:id', (req, res) => {
    const userId = req.params.id;
    const sql = 'DELETE FROM users WHERE user_id = ?';

    conn.query(sql, [userId], (err) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        res.redirect('/logout');
    });
});

router.get('/logout', (req, res) => {
    
    // req.session.destroy((err) => {
    //     if (err) {
    //         console.error('Error destroying session:', err);
    //         res.status(500).send('Internal Server Error');
    //         return;
    //     }
    //     // Redirect to login page after logout
    //     res.redirect('/login');
    // });

    res.sendFile(path.join(__dirname + '/../frontend/login.html'));
});

router.get('/DisneyHome', function (req, res) {
    res.sendFile(path.join(__dirname + '/../frontend/views/DisneyHome.html'));
});


    router.get('/home', (req, res) => {
        const userId = req.session.userId;

        const sql = "SELECT * FROM hotel";

        conn.query(sql, [userId], (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                res.status(500).send('Internal Server Error');
                return;
            }

            if (results.length > 0) {
                // ตรวจสอบว่าผลลัพธ์ไม่ว่าง
                req.session.hotelId = results[0].hotel_id;  // กำหนด hotel_id จากผลลัพธ์ที่ได้จากฐานข้อมูล
            }
            console.log('SELECT OK');

            // ส่งข้อมูลสินค้าไปยัง view home.ejs
            res.render('home', { hotel: results });
        });
    });


    router.post('/book', (req, res) => {
        const { hotelId } = req.body;
        const userId = req.session.userId;

        

        if (!userId) {
            return res.redirect('/login');
        }

        const sql = "INSERT IGNORE INTO users_has_hotel (user_id, hotel_id) VALUES (?, ?)";
        conn.query(sql, [userId, hotelId], (err, result) => {
            if (err) {
                console.error('Error executing query:', err);
                res.status(500).send('Internal Server Error');
                return;
            }
            console.log('KKKKKKKK:');
            console.log('Booking successful:');
            // res.redirect('/booking');
        });
    });



    router.get('/booking', (req, res) => {
        const userId = req.session.userId; // Get userId from session
        // const hotelId = req.params.id;

        if (!userId) {
            return res.redirect('/login');
        }

        const sql = `
            SELECT *
            FROM users u
            JOIN users_has_hotel uh ON u.user_id = uh.user_id
            JOIN hotel h ON uh.hotel_id = h.hotel_id
            WHERE u.user_id = ?
        `;

        conn.query(sql, [userId],  (err, results) => {
            if (err) {
                console.error('Error fetching bookings:', err);
                res.status(500).send('Internal Server Error');
                return;
            }

            console.log('Bookings fetched successfully:');

            //Render ขึ้น booking
            res.render('booking', { bookings: results });
        });
    });


    router.post('/deleteHotel/:id', (req,res) => {
        const userId = req.session.userId;
        const hotelId = req.params.id;

        const sql = 'DELETE FROM users_has_hotel WHERE user_id = ? AND hotel_id = ?';
    
        conn.query(sql, [userId, hotelId], (err) => {
            if (err) {
                console.error('Error executing query:', err);
                res.status(500).send('Internal Server Error');
                return;
            }
    
            res.redirect('/booking');
        });
    })

    router.get('/carRentalPreview', (req, res) => {
    
        const sql = `SELECT * FROM carRental`; 
        conn.query(sql, (err, results) => {
            if (err) {
                console.error('Error fetching car rentals:', err);
                res.status(500).send('Internal Server Error');
                return;
            }
            res.render('carRentalPreview', { car: results});
        });
    });

    // กำหนดเส้นทางสำหรับแสดงหน้า carRental
    
    router.get('/carRental', (req, res) => {
        
    const hotelId = req.query.hotelId;
    if (!hotelId) {
        return res.status(400).send('Hotel ID is required');
    }


    const sql = `SELECT * FROM carRental`;
    conn.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching car rentals:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('carRental', { car: results, hotelId: hotelId });
    });
});

  
  // กำหนดเส้นทางสำหรับการยืนยันการจองรถเช่า
  router.post('/carRentalConfirm', (req, res) => {
    const hotelId = req.body.hotelId || req.query.hotelId; // รับค่า hotelId จาก req.body หรือ req.query
    const carRental_id = req.body.carRental_id;
    const userId = req.session.userId;

    if (!userId) {
        return res.redirect('/login');
    }

    console.log("TEST_TEST", userId, carRental_id, hotelId);

    // SQL query to insert into users_has_hotel_has_carRental
    const sql = `
        INSERT IGNORE INTO users_has_hotel_has_carRental (user_id, carRental_id, hotel_id)
        VALUES (?, ?, ?)
    `;

    conn.query(sql, [userId, carRental_id, hotelId], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('Internal Server Error');
        }

        console.log('Car rental successful:', result);

        // Redirect to booking page after successful booking
        res.redirect('/user_has_hotel_has_car');
    });
});

  

router.get('/user_has_hotel_has_car', (req, res) => {
    const userId = req.session.userId; // Get userId from session
    const hotelId = req.body.hotelId || req.query.hotelId; // รับค่า hotelId จาก req.body หรือ req.query
    const carRental_id = req.body.carRental_id || req.query.carRental_id;

    if (!userId) {
        return res.redirect('/login');
    }

    const sql = `
        SELECT *
        FROM users u
        JOIN users_has_hotel_has_carRental uhc ON u.user_id = uhc.user_id
        JOIN hotel h ON uhc.hotel_id = h.hotel_id
        JOIN carRental cr ON uhc.carRental_id = cr.carRental_id
        WHERE u.user_id = ?
    `;

    conn.query(sql, [userId, hotelId, carRental_id], (err, results) => {
        if (err) {
            console.error('Error fetching car rental confirmations:', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        console.log('Car Rental Confirmations fetched successfully:', results);

        // Render car rental confirmations data to carRentalConfirm.ejs view
        res.render('user_has_hotel_has_car', { rentalconfirm: results, hotelId: hotelId  });
    });
});

// หน้าpayments
router.get('/payments', (req, res) => {
    const { hotelId, carRentalId } = req.query;
    const userId = req.session.userId;

    console.log("Payments Page:", hotelId, carRentalId, userId);

    res.render('payments', { hotelId, carRentalId, userId });
});



router.post('/processPayment', (req, res) => {
    const { hotelId, carRentalId } = req.body;
    const userId = req.session.userId;

    console.log("Process Payment:", hotelId, carRentalId, userId);

    // res.send(`Payment successful for User ID: ${userId} Hotel ID: ${hotelId} and Car Rental ID: ${carRentalId}`);

    res.sendFile(path.join(__dirname + '/../frontend/ticket.html'));
});


router.post('/deleteCar/:id', (req, res) => {
    const userId = req.params.id;
    const { hotelId, carRentalId } = req.body; 
    const sql = 'DELETE FROM users_has_hotel_has_carRental WHERE carRental_id = ?';

    conn.query(sql, [userId, hotelId, carRentalId], (err) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        res.redirect('/user_has_hotel_has_car');
    });
});


router.get('/diary', (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.redirect('/login');
    }

    const sql = 'SELECT * FROM DAIRY WHERE user_id = ?';

    conn.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching diary entries:', err);
            return res.status(500).send('Internal Server Error');
        }

        console.log('Fetched diary entries successfully:', results);


        res.render('diary', { note: results, });
    });
});
                                                                                                                                    
router.post('/note', (req, res) => {
    const userId = req.session.userId;
    const { note } = req.body;


    if (!userId || !note) {
        return res.status(400).send('Missing userId or note');
    }

    const sql = 'INSERT INTO DAIRY (user_id, diary) VALUES (?, ?)';

    conn.query(sql, [userId, note], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('Internal Server Error');
        }

        console.log('Note added successfully:', result);

        res.redirect('/diary');
    });
});

router.post('/updateNote/:id', (req, res) => {
    const noteId = req.params.id;
    const newContent = req.body.note;
    const userId = req.session.userId;

    const sql = 'UPDATE DAIRY SET diary = ? WHERE id = ? AND user_id = ?';

    conn.query(sql, [newContent, noteId, userId], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        console.log('Number of records updated: ' + result.affectedRows);
        res.redirect('/diary');
    });
});



router.post('/deleteNote/:id', (req, res) => {
    const noteId = req.params.id;
    const userId = req.session.userId;

    const sql = 'DELETE FROM DAIRY WHERE id = ? AND user_id = ?';

    conn.query(sql, [noteId, userId], (err) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        res.redirect('/diary');
    });
});










app.use('/', router);

var server = app.listen(port, '10.4.53.25', function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log(`Disney Hotel is deployed at : ${port}`);
});
