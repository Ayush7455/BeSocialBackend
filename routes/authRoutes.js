const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model("User");
const Posts=mongoose.model("Posts")
const jwt = require('jsonwebtoken');
require('dotenv').config();
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const { request } = require('express');


async function mailer(recieveremail, code) {
   

    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,

        secure: false, 
        requireTLS: true,
        auth: {
            user: process.env.NodeMailer_email,
            pass: process.env.NodeMailer_password, 
        },
    });


    let info = await transporter.sendMail({
        from: "GeekChat",
        to: `${recieveremail}`,
        subject: "Email Verification",
        text: `Your Verification Code is ${code}`,
        html: `<b>Your Verification Code is ${code}</b>`,
    })

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

router.post('/verify', (req, res) => {
    console.log('sent by client', req.body);
    const { email } = req.body;

    if (!email) {
        return res.status(422).json({ error: "Please add all the fields" });
    }

    User.findOne({ email: email }).then(async (savedUser) => {
        if (savedUser) {
            return res.status(422).json({ error: "Invalid Credentials" });
        }
        try {
            let VerificationCode = Math.floor(100000 + Math.random() * 900000);
            await mailer(email, VerificationCode);
            console.log("Verification Code", VerificationCode);
            res.send({ message: "Verification Code Sent to your Email", VerificationCode, email });
        }
        catch (err) {
            console.log(err);
        }
    }
    )
})


router.post('/changeusername', (req, res) => {
    const { username, email } = req.body;

    User.find({ username }).then(async (savedUser) => {
        if (savedUser.length > 0) {
            return res.status(422).json({ error: "Username already exists" });
        }
        else {
            return res.status(200).json({ message: "Username Available", username, email });
        }
    })
})




router.post('/signup', async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
        return res.status(422).json({ error: "Please add all the fields" });
    }
    else {
        const user = new User({
            username,
            email,
            password,
        })

        try {
            await user.save();
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
            return res.status(200).json({ message: "User Registered Successfully", token });

        }
        catch (err) {
            console.log(err);
            return res.status(422).json({ error: "User Not Registered" });
        }
    }
})





router.post('/verifyfp', (req, res) => {
    console.log('sent by client', req.body);
    const { email } = req.body;

    if (!email) {
        return res.status(422).json({ error: "Please add all the fields" });
    }

    User.findOne({ email: email }).then(async (savedUser) => {
        if (savedUser) {
            try {
                let VerificationCode = Math.floor(100000 + Math.random() * 900000);
                await mailer(email, VerificationCode);
                console.log("Verification Code", VerificationCode);
                res.send({ message: "Verification Code Sent to your Email", VerificationCode, email });
            }
            catch (err) {
                console.log(err);
            }
        }
        else {
            return res.status(422).json({ error: "Invalid Credentials" });
        }
    }
    )
})


router.post('/resetpassword', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(422).json({ error: "Please add all the fields" });
    }
    else {
        User.findOne({ email: email })
            .then(async (savedUser) => {
                if (savedUser) {
                    savedUser.password = password;
                    savedUser.save()
                        .then(user => {
                            res.json({ message: "Password Changed Successfully" });
                        })
                        .catch(err => {
                            console.log(err);
                        })
                }
                else {
                    return res.status(422).json({ error: "Invalid Credentials" });
                }
            })
    }

})

router.post('/signin', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(422).json({ error: "Please add all the fields" });
    }
    else {
        User.findOne({ email: email })
            .then(savedUser => {
                if (!savedUser) {
                    return res.status(422).json({ error: "Invalid Credentials" });
                }
                else {
                    console.log(savedUser);
                    bcrypt.compare(password, savedUser.password)
                        .then(
                            doMatch => {
                                if (doMatch) {
                                    const token = jwt.sign({ _id: savedUser._id }, process.env.JWT_SECRET);

                                    const { _id, username, email, profilepic } = savedUser;

                                    res.json({ message: "Successfully Sign In", token, user: { _id, username, email, profilepic} });
                                }
                                else {
                                    return res.status(422).json({ error: "Invalid Credentials" });
                                }
                            }
                        )
                  
                }
            })
            .catch(err => {
                console.log(err);
            })
    }
})

//userdata

// router.post('/otheruserdata', (req, res) => {
//     const { email } = req.body;

//     User.findOne({ email: email })
//         .then(savedUser => {
//             if (!savedUser) {
//                 return res.status(422).json({ error: "Invalid Credentials" });
//             }
//             else {
//                 console.log(savedUser);
//                 res.status(200).json({ message: "User Found", user: savedUser });
//             }
//         })
// })


router.post('/userdata', (req, res) => {
    const { authorization } = req.headers;
    
    if (!authorization) {
        return res.status(401).json({ error: "You must be logged in, token not given" });
    }
    const token = authorization.replace("Bearer ", "");
  

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
            return res.status(401).json({ error: "You must be logged in, token invalid" });
        }
        const { _id } = payload;
        User.findById(_id).then(userdata => {
            res.status(200).send({
                message: "User Found",
                user: userdata
            });
        })

    })
})


router.post('/changepassword', (req, res) => {
    const { oldpassword, newpassword, email } = req.body;

    if (!oldpassword || !newpassword || !email) {
        return res.status(422).json({ error: "Please add all the fields" });
    }
    else {
        User.findOne({ email: email })
            .then(async savedUser => {
                if (savedUser) {
                    bcrypt.compare(oldpassword, savedUser.password)
                        .then(doMatch => {
                            if (doMatch) {
                                savedUser.password = newpassword;
                                savedUser.save()
                                    .then(user => {
                                        res.json({ message: "Password Changed Successfully" });
                                    })
                                    .catch(err => {
                                        
                                        return res.status(422).json({ error: "Server Error" });

                                    })
                            }
                            else {
                                return res.status(422).json({ error: "Invalid Credentials" });
                            }
                        })

                }
                else {
                    return res.status(422).json({ error: "Invalid Credentials" });
                }
            })
    }
})



router.post('/setusername', (req, res) => {
    const { username, email } = req.body;
    if (!username || !email) {
        return res.status(422).json({ error: "Please add all the fields" });
    }

    User.find({ username }).then(async (savedUser) => {
        if (savedUser.length > 0) {
            return res.status(422).json({ error: "Username already exists" });
        }
        else {
            User.findOne({ email: email })
                .then(async savedUser => {
                    if (savedUser) {
                        savedUser.username = username;
                        savedUser.save()
                            .then(user => {
                                res.json({ message: "Username Updated Successfully" });
                            })
                            .catch(err => {
                                return res.status(422).json({ error: "Server Error" });
                            })
                    }
                    else {
                        return res.status(422).json({ error: "Invalid Credentials" });
                    }
                })
        }
    })




})

router.post('/setdescription', (req, res) => {
    const { description, email } = req.body;
    if (!description || !email) {
        return res.status(422).json({ error: "Please add all the fields" });
    }

    User.findOne({ email: email })
        .then(async savedUser => {
            if (savedUser) {
                savedUser.description = description;
                savedUser.save()
                    .then(user => {
                        res.json({ message: "Description Updated Successfully" });
                    })
                    .catch(err => {
                        return res.status(422).json({ error: "Server Error" });
                    })
            }
            else {
                return res.status(422).json({ error: "Invalid Credentials" });
            }
        })
})




router.post('/searchuser', (req, res) => {
    const { keyword } = req.body;

    if (!keyword) {
        return res.status(422).json({ error: "Please search a username" });
    }

    User.find({ username: { $regex: keyword, $options: 'i' } })
        .then(user => {
            
            let data = [];
            user.map(item => {
                data.push(
                    {
                        _id: item._id,
                        username: item.username,
                        email: item.email,
                        description: item.description,
                        profilepic: item.profilepic
                    }
                )
            })

            
            if (data.length == 0) {
                return res.status(422).json({ error: "No User Found" });
            }
            res.status(200).send({ message: "User Found", user: data });

        })
        .catch(err => {
            res.status(422).json({ error: "Server Error" });
        })
})



router.post('/otheruserdata', (req, res) => {
    const { email } = req.body;

    User.findOne({ email: email })
        .then(saveduser => {
            if (!saveduser) {
                return res.status(422).json({ error: "Invalid Credentials" });
            }
            

            let data = {
                _id: saveduser._id,
                username: saveduser.username,
                email: saveduser.email,
                description: saveduser.description,
                profilepic: saveduser.profilepic,
                followers: saveduser.followers,
                following: saveduser.following,
                posts: saveduser.posts
            }

         

            res.status(200).send({
                user: data,
                message: "User Found"
            })
        })
})
router.post('/getuserbyid', (req, res) => {
    const {userid } = req.body;

    User.findById({ _id: userid })
        .then(saveduser => {
            if (!saveduser) {
                return res.status(422).json({ error: "Invalid Credentials" });
            }
    

            let data = {
                _id: saveduser._id,
                username: saveduser.username,
                email: saveduser.email,
                description: saveduser.description,
                profilepic: saveduser.profilepic,
                followers: saveduser.followers,
                following: saveduser.following,
                posts: saveduser.posts
            }

           

            res.status(200).send({
                user: data,
                message: "User Found"
            })
        })
        .catch(
            err => {
                console.log('error in getuserbyid ');
            }
        )
})


router.post('/followuser', (req, res) => {
    const { followfrom, followto } = req.body;
    console.log(followfrom, followto);
    if (!followfrom || !followto) {
        return res.status(422).json({ error: "Invalid Credentials" });
    }
    User.findOne({ email: followfrom })
        .then(mainuser => {
            if (!mainuser) {
                return res.status(422).json({ error: "Invalid Credentials" });
            }
            else {
                if (mainuser.following.includes(followto)) {
                    console.log("already following");
                }
                else {
                    mainuser.following.push(followto);
                    mainuser.save();
                }
                


                User.findOne(
                    { email: followto }
                )
                    .then(otheruser => {
                        if (!otheruser) {
                            return res.status(422).json({ error: "Invalid Credentials" });
                        }
                        else {
                          
                            if (otheruser.followers.includes(followfrom)) {
                                console.log("already followed");
                            }
                            else {
                                otheruser.followers.push(followfrom);
                                otheruser.save()
                            }
                            res.status(200).send({
                                message: "User Followed"
                            })
                        }
                    })
                    .catch(err => {
                        return res.status(422).json({ error: "Server Error" });
                    })
            }

        }
        ).catch(err => {
            return res.status(422).json({ error: "Server Error" });
        })



})


router.post('/checkfollow', (req, res) => {
    const { followfrom, followto } = req.body;
    console.log(followfrom, followto);
    if (!followfrom || !followto) {
        return res.status(422).json({ error: "Invalid Credentials" });
    }
    User.findOne({ email: followfrom })
        .then(mainuser => {
            if (!mainuser) {
                return res.status(422).json({ error: "Invalid Credentials" });
            }
            else {
                let data = mainuser.following.includes(followto);
                console.log(data);
                if (data == true) {
                    res.status(200).send({
                        message: "User in following list"
                    })
                }
                else {
                    res.status(200).send({
                        message: "User not in following list"
                    })
                }
            }

        })
        .catch(err => {
            return res.status(422).json({ error: "Server Error" });
        })
})


router.post('/unfollowuser', (req, res) => {
    const { followfrom, followto } = req.body;
    console.log(followfrom, followto);
    if (!followfrom || !followto) {
        return res.status(422).json({ error: "Invalid Credentials" });
    }
    User.findOne({ email: followfrom })
        .then(mainuser => {
            if (!mainuser) {
                return res.status(422).json({ error: "Invalid Credentials" });
            }
            else {
                if (mainuser.following.includes(followto)) {
                    let index = mainuser.following.indexOf(followto);
                    mainuser.following.splice(index, 1);
                    mainuser.save();

                    User.findOne(
                        { email: followto }
                    )
                        .then(otheruser => {
                            if (!otheruser) {
                                return res.status(422).json({ error: "Invalid Credentials" });
                            }
                            else {
                                if (otheruser.followers.includes(followfrom)) {
                                    let index = otheruser.followers.indexOf(followfrom);
                                    otheruser.followers.splice(index, 1);
                                    otheruser.save();
                                }
                                res.status(200).send({
                                    message: "User Unfollowed"
                                })
                            }
                        })
                        .catch(err => {
                            return res.status(422).json({ error: "Server Error" });
                        })
                }
                else {
                    console.log("not following");
                }
               

            }
        })
        .catch(err => {
            return res.status(422).json({ error: "Server Error" });
        })
})
router.get('/getposts', (req, res) => {
    Posts.find()
      .then(posts => res.json(posts))
      .catch(err => res.status(400).json(`Error: ${err}`));
  });
  router.post('/getuserposts', (req, res) => {
    const { username } = req.body;
    Posts.find({username:username})
      .then(posts => res.json(posts))
      .catch(err => res.status(400).json(`Error: ${err}`));
  });

module.exports = router;
