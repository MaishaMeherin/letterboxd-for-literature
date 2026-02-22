import FormManual from "../components/Form";

function Login() {
  return <FormManual route={"api/token/"} method="login" />;
}

export default Login;
