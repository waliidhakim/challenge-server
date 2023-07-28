// const express = require('express')
const createError = require('http-errors')
// const mongoose = require('mongoose')

// const pool = require('../db/dbPostgres');
// const postgresQuries = require('../db/posgresQueries');

// const authController = require('./authController');
const UserMg = require('../db/mongo/models/userModel')
const UserPg = require('../db/postGres/models/userPostgresModel')
const GameMg = require('../db/mongo/models/gameModel')
const GamePg = require('../db/postGres/models/gamePostgresModel')
const CardMg = require('../db/mongo/models/cardModel')
const CardPg = require('../db/postGres/models/cardPostgresModel')

const getOne = async (req, res, next) => {
    const { id } = req.params

    console.log('get one user endpoint')
    try {
        const user = await UserMg.findById(id)

        if (!user) {
            return next(createError(404))
        }

        res.status(200).json({
            status: 'success',
            data: {
                user: user,
            },
        })
    } catch (error) {
        console.log(error)
        return next(createError(500))
    }
}

const getAll = async (req, res, next) => {
    try {
        //postgres test

        // pool.query(postgresQuries.getUsers, (error, results)=>{
        //     if(error){
        //         throw error;
        //     }
        //     postgres = results.rows;
        //     console.log("postgres user : ", results.rows);

        // })

        console.log('getAll users endpoint')
        const users = await UserMg.find()

        res.status(200).json({
            status: 'success',
            count: users.length,
            data: {
                users: users,
            },
            // dataPostres : {
            //     postgres : postgres
            // }
        })
    } catch (error) {
        console.log(error)
        return next(createError(500))
    }
}

const createOne = async (req, res, next) => {
    const {
        firstName,
        lastName,
        email,
        password,
        passwordConfirm,
        date_of_birth,
        role,
    } = req.body
    try {
        const user = await UserMg.create({
            firstName: firstName,
            lastName: lastName,
            date_of_birth: date_of_birth,
            email: email,
            password: password,
            passwordConfirm: passwordConfirm,
            role: role,
        })

        //create pg user
        // IMPORTANT: I USED THE Already hashed password from the mongo user
        const newUserpg = await UserPg.create({
            firstname: firstName,
            lastname: lastName,
            email: email,
            password: user.password,
            role: role || 'user',
        })

        // await user.save()
        res.status(201).json({
            status: 'success',
            data: {
                user: user,
            },
        })
    } catch (error) {
        console.log('Error Type : ', error.name)
        if (error.name === 'ValidationError') {
            // Erreur de validation Mongoose
            const validationErrors = {}

            // Personnaliser les messages d'erreur
            for (const field in error.errors) {
                const errorMessage = error.errors[field].message
                validationErrors[field] = errorMessage
            }

            return res.status(400).json({
                status: 'fail',
                message: {
                    errors: validationErrors,
                },
            })
        }
        return next(createError(500, `somthing went wrong ${error}`))
    }
}

const deleteOne = async (req, res, next) => {
    const { id } = req.params
    try {
        const deletedUser = await UserMg.findByIdAndDelete(id)
        //console.log(deletedUser);
        if (!deletedUser) {
            return res.status(404).json({
                status: 'fail',
                message: 'user not found',
            })
        }

        const userPg = await UserPg.findOne({
            where: { email: deletedUser.email },
        })
        console.log('userPg', userPg)
        await userPg.destroy()

        res.status(200).json({
            status: 'success',
            message: 'user deleted successfully',
        })
    } catch (error) {
        console.log(error)
        return next(createError(500))
    }
}

const updateOne = async (req, res, next) => {
    const { id } = req.params
    //const { name } = req.body
    //console.log("update user endpoint");
    const { name, email, password, passwordConfirm, date_of_birth } = req.body
    try {
        //user with the id "id" does not existe then we create it
        // const user = await UserMg.findByIdAndUpdate(req.params.id , req.body , {
        // new : true,
        // runValidators : true
        // } );
        const CurrentUser = await UserMg.findOne({ _id: id })
        const updatedUser = await UserMg.updateOne(
            { _id: id },
            { $set: req.body },
            {
                new: true,
                runValidators: true,
            }
        )

        //pg user update
        //search ny email
        let userEmail

        if (req.body.email) {
            userEmail = CurrentUser.email
        } else {
            userEmail = updatedUser.email
        }

        console.log('userEmail', userEmail)
        const userPg = await UserPg.findOne({ where: { email: userEmail } })
        //lowercase all the left attributs in the req.body because in PostGres all the column names are in lowercase
        const updatedUserData = Object.fromEntries(
            Object.entries(req.body).map(([key, value]) => [
                key.toLowerCase(),
                value,
            ])
        )
        await userPg.update(updatedUserData)

        return res.status(201).json({
            status: 'success',
            data: {
                user: updatedUser,
            },
        })
    } catch (error) {
        console.log('Error Type : ', error.name)
        if (error.name === 'ValidationError') {
            // Erreur de validation Mongoose
            const validationErrors = {}

            // Personnaliser les messages d'erreur
            for (const field in error.errors) {
                const errorMessage = error.errors[field].message
                validationErrors[field] = errorMessage
            }

            return res.status(400).json({
                status: 'fail',
                message: {
                    errors: validationErrors,
                },
            })
        }
        return next(createError(500, `${error}`))
    }
}

const getMe = async (req, res, next) => {
    const userId = req.user._id
    try {
        const user = await UserMg.findById(userId).populate('games')
        if (!user) {
            return next(createError(404, 'user not found'))
        }
        res.status(200).json({
            status: 'success',
            data: {
                user: user,
            },
        })
    } catch (error) {
        console.log(error)
        return next(createError(500))
    }
}

const deleteMe = async (req, res, next) => {
    const userId = req.user._id
    try {
        const deletedUser = await UserMg.findByIdAndDelete(userId)
        if (!deletedUser) {
            return res.status(404).json({
                status: 'fail',
                message: 'user not found',
            })
        }
        res.status(200).json({
            status: 'success',
            message: 'user deleted successfully',
        })
    } catch (error) {
        console.log(error)
        return next(createError(500))
    }
}

const updateMe = async (req, res, next) => {
    const userId = req.user._id
    const { firstName, lastName, date_of_birth } = req.body
    try {
        const user = await UserMg.findById(userId)
        if (!user) {
            return next(createError(404))
        }

        if (firstName) {
            user.firstName = firstName
        }
        if (lastName) {
            user.lastName = lastName
        }
        if (date_of_birth) {
            user.date_of_birth = date_of_birth
        }
        await user.save({ validateBeforeSave: false })

    res.status(200).json({
      status: "success",
      data: {
        user: user,
      },
    });
  } catch (error) {
    console.log(error);
    return next(createError(500));
  }
};


const updateMyStatus = async (req, res, next) => {
  console.log("updateStatus endpoint");
  const userId = req.user._id;
  const { status } = req.body;
  try {
    const user = await UserMg.findById(userId);
    if (!user) {
      return next(createError(404));
    }

    if (status) {
      user.status = status;
    }
    
    await user.save( { validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      data: {
        user: user,
      },
    });
  } catch (error) {
    console.log(error);
    return next(createError(500, 'error update me'));
  }
};

const joinGame = async (req, res, next) => {
    const { gameId } = req.params
    const userId = req.user._id
    // try {
        const game = await GameMg.findById(gameId)
        if (!game) {
            return next(createError(404), 'game not found')
        }
        if (game.status === 'started') {
            return next(createError(400, 'game already started'))
        }
        if (game.status === 'ended') {
            return next(createError(400, 'game already ended'))
        }
        if (game.players.includes(userId)) {
            return next(createError(400, 'user already joined'))
        }
        if (game.players.length >= 4) {
            return next(createError(400, 'game is full'))
        }
        game.players.push(userId)
        await game.save()
        res.status(200).json({
            status: 'success',
            data: {
                game: game,
            },
        })
    // } catch (error) {
    //     console.log(error)
    //     return next(createError(500))
    // }
}

const inactivePlayer = async (req, res, next) => {
    const { gameId } = req.params
    const userId = req.user._id
    try {
      const user = await UserMg.findById(userId)
      if (!user) {
        return next(createError(404))
      }

      const game = await GameMg.findById(gameId)
      if (!game) {
        return next(createError(404))
      }
      if (game.status !== 'started') {
        return next(createError(400, 'game not started'))
      }
      if (!game.players.includes(userId)) {
        return next(createError(400, 'user not in game'))
      }
      if (game.players[game.turn].toString() !== userId.toString()) {
        return next(createError(400, 'not your turn'))
      }
      game.turn = (game.turn + 1) % game.players.length
      await game.save()
      res.status(200).json({
        status: 'success',
        data: {
          game: game,
        },
      })
    } catch (error) {
      console.log(error)
      return next(createError(500))
    }
  }

const getUserIndex = async (req, res, next) => {
    const { gameId } = req.params
    const userId = req.user._id
    try {
        const user = await UserMg.findById(userId)
        if (!user) {
            return next(createError(404, 'user not found'))
        }
        const game = await GameMg.findById(gameId)
        if (!game) {
            return next(createError(404, 'game not found'))
        }

        const index = game.players.findIndex((player) => {
            return player.toString() === userId.toString()
        })
        res.status(200).json({
            status: 'success',
            data: {
                index: index,
            },
        })
    } catch (error) {
        console.log(error)
        return next(createError(500))
    }
}

// const makeMove = async (req, res, next) => {
//   const { id } = req.params;
//   const userId = req.user._id;
//   const { cardId, gameId } = req.body;

//   const user = await UserMg.findById(userId);
//   if (!user) {
//     return next(createError(404, "user not found"));
//   }
//   const game = await GameMg.findById(gameId).populate("currentCard");
//   if (!game) {
//     return next(createError(404, "game not found"));
//   }
//   const card = await CardMg.findById(cardId);
//   if (!card) {
//     return next(createError(404, "card not found"));
//   }
//   if (game.status !== "started") {
//     return next(createError(400, "game not started"));
//   }

// const signup = async(req,res,next)=>{

//     try{
//         console.log("signup endpoint");

//     }
//     catch(error){
//         res.status(500).json({
//             status : 'fail',
//             message : 'Server internal error !',
//             error : error
//         })
//     }
// }

module.exports = {
    // signup,
    updateOne,
    deleteOne,
    createOne,
    getAll,
    getOne,
    getMe,
    deleteMe,
    updateMe,
    joinGame,
  updateMyStatus,
    getUserIndex,
    inactivePlayer,
}
