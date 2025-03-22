import {Router} from 'express';
import { changePassword, getCurrentUser, logoutUser, registerUser, loginUser, regenerateAccessToken, updateUserProfile, updateAvatar, updateCoverImage } from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import multer from 'multer';

const router = Router();

router.route('/register').post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser)

router.route('/login').post(loginUser);

router.route('/logout').post(
verifyJWT,
logoutUser
);

router.route('/regenerate-token').post(regenerateAccessToken);

router.route('/change-password', verifyJWT, changePassword);

router.route('/get-user', verifyJWT, getCurrentUser);

router.route('/update-profile', verifyJWT, updateUserProfile);

router.route('/update-avatar', multer, verifyJWT, updateAvatar);

router.route('/update-coverImage', multer, verifyJWT, updateCoverImage);


export default router