import {Router} from 'express';
import { changePassword, getCurrentUser, logoutUser, registerUser, loginUser, regenerateAccessToken, updateUserProfile, updateAvatar, updateCoverImage, userChannelProfile, watchHistory } from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

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

router.route('/change-password').post(verifyJWT, changePassword);

router.route('/get-user').post(verifyJWT, getCurrentUser);

router.route('/update-profile').patch(verifyJWT, updateUserProfile);

router.route('/update-avatar').patch(verifyJWT, upload.single("avatar"),  updateAvatar);

router.route('/update-coverImage').patch(verifyJWT, upload.single("coverImage"), updateCoverImage);

router.route('/c/:username').get(verifyJWT, userChannelProfile );

router.route('/watch-history').get(verifyJWT, watchHistory);


export default router;