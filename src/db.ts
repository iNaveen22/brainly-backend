import mongoose, { model, Schema} from "mongoose";

const UserSchema = new Schema({
    userName: {type: String, unique: true},
    password: String
});

const user = model("User", UserSchema);

const ContentSchema = new Schema({
    title: String,
    link: String,
    tags: [{type: mongoose.Types.ObjectId, ref: "Tag"}],
    userId: {type: mongoose.Types.ObjectId, ref: 'User', required: true}
})

export const content = model("Content", ContentSchema)

export default user;