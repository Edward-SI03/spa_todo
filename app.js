const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Todo = require("./models/todo");

mongoose.connect("mongodb://localhost/todo-demo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

const app = express();
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hi!");
});

// 할일 목록 조회
router.get("/todos", async (req, res) => {
  const todos = await Todo.find().sort("-order").exec();

  res.send({ todos });
});

// 할일 목록 생성
router.post("/todos", async (req, res) => {
  const { value } = req.body;
  const maxOrderTodo = await Todo.findOne().sort("-order").exec();
  let order = 1;

  if (maxOrderTodo) {
    order = maxOrderTodo.order + 1;
  }
  const todo = new Todo({ value, order });
  await todo.save();

  res.send({ todo });
});

// 할일 목록 수정
router.patch("/todos/:todoId", async (req, res) => {
  const { todoId } = req.params;
  const { order, value, done } = req.body;

  const todo = await Todo.findById(todoId).exec();

  // 순서 수정
  if (order) {
    const targetTodo = await Todo.findOne({ order }).exec();
    if (targetTodo) {
      targetTodo.order = todo.order;
      await targetTodo.save();
    }
    todo.order = order;

    // 내용 수정
  } else if (value) {
    await Todo.updateOne({ _id: todoId }, { $set: { value: value } });

    // 완료 여부
  } else if (done) {
    await Todo.updateOne({ _id: todoId }, { $set: { doneAt: new Date() } });
  } else {
    await Todo.updateOne({ _id: todoId }, { $set: { doneAt: "" } });
  }

  await todo.save();

  res.send({});
});

// 할일 목록 삭제
router.delete("/todos/:todoId", async (req, res) => {
  const { todoId } = req.params;

  await Todo.deleteOne({ _id: todoId });

  res.send({});
});

app.use("/api", bodyParser.json(), router);
app.use(express.static("./assets"));

app.listen(8080, () => {
  console.log("서버가 켜졌어요!");
});
