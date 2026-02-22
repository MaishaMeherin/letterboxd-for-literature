import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { Button, Form, Input } from "antd";

function FormManual({ route, method }) {
  const navigate = useNavigate();
  const name = method === "login" ? "Login" : "Register";

  const handleSubmit = async (values) => {
    const { email, username, password } = values;
    if (method === "login") {
      try {
        const res = await api.post("/api/v1/auth/login/", { username, password });
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        (localStorage.setItem(REFRESH_TOKEN, res.data.refresh), navigate("/"));
      } catch (error) {
        console.log(error.response.data);
      }
    } else {
      try {
        const res = await api.post("/api/v1/auth/register/", {
          email,
          username,
          password,
        });

        navigate("/login");
      } catch (error) {
        console.log(error.response.data);
      }
    }
  };

  return (
    <Form
      name="basic"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      onFinish={handleSubmit}
      autoComplete="off"
    >
      <h1>{name}</h1>
      {method === "register" && (
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: "Please input your email!" }]}
        >
          <Input />
        </Form.Item>
      )}
      <Form.Item
        label="Username"
        name="username"
        rules={[{ required: true, message: "Please input your username!" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true, message: "Please input your password!" }]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item label={null}>
        <Button type="primary" htmlType="submit">
          {name}
        </Button>
      </Form.Item>
    </Form>
  );
}

export default FormManual;
