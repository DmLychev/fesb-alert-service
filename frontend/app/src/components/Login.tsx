import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { Controller, useForm } from "react-hook-form";
import { Box, Button, Card, Field, Flex, Stack } from "@chakra-ui/react";
import FloatingLabelInput from "./FloatingLabelInput";
import { toaster } from "./ui/toaster";

interface formData {
  username: string;
  password: string;
}

const Login = () => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<formData>({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const onSubmit = handleSubmit(async (data: formData) => {
    try {
      const res = await api.post("/api/token/", {
        username: data.username,
        password: data.password,
      });
      localStorage.setItem(ACCESS_TOKEN, res.data.access);
      localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
      navigate(from, { replace: true });
    } catch (error: any) {
      reset({
        username: "",
        password: "",
      });
      toaster.create({
        title: error.message,
        type: "error",
        duration: 6000,
      });
    }
  });

  return (
    <Flex minH="100vh" align="center" justify="center" p={4}>
      <Box maxW="md" width="100%">
        <Card.Root maxW="sm">
          <Card.Header>
            <Card.Title textAlign="center" fontSize={24}>
              Вход
            </Card.Title>
          </Card.Header>

          <Card.Body>
            <form onSubmit={onSubmit}>
              <Stack gap="4" w="full">
                <Field.Root invalid={!!errors.username}>
                  <Controller
                    name="username"
                    control={control}
                    rules={{
                      required: "Имя пользователя не может быть пустым",
                    }}
                    render={({ field }) => (
                      <FloatingLabelInput
                        {...field}
                        value={field.value}
                        onValueChange={field.onChange}
                        label="Имя пользователя"
                      />
                    )}
                  />
                  {errors.username && (
                    <Field.ErrorText>{errors.username.message}</Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root invalid={!!errors.password}>
                  <Controller
                    name="password"
                    control={control}
                    rules={{
                      required: "Пароль не может быть пустым",
                    }}
                    render={({ field }) => (
                      <FloatingLabelInput
                        {...field}
                        value={field.value}
                        onValueChange={field.onChange}
                        type="password"
                        label="Пароль"
                      />
                    )}
                  />
                  {errors.password && (
                    <Field.ErrorText>{errors.password.message}</Field.ErrorText>
                  )}
                </Field.Root>

                <Button type="submit" mt={4} loading={isSubmitting}>
                  Войти
                </Button>
              </Stack>
            </form>
          </Card.Body>
        </Card.Root>
      </Box>
    </Flex>
  );
};

export default Login;
