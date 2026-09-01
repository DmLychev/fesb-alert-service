from django.test import TestCase
from django.contrib.auth import get_user_model


class ModelTests(TestCase):
    def test_create_user_successful(self):
        username = 'user'
        password = 'test1234'
        email = 'test@example.com'
        user = get_user_model().objects.create_user(username=username, password=password, email=email)

        self.assertEqual(user.username, username)
        self.assertTrue(user.check_password(password))
        self.assertEqual(user.email, email)

    def test_create_superuser_successful(self):
        user = get_user_model().objects.create_superuser(username='superuser', password='test1234')

        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_staff)

    def test_new_user_email_normalized(self):
        sample_data = [
            ['user1', 'test1@EXAMPLE.com', 'test1@example.com'],
            ['user2', 'Test2@Example.com', 'Test2@example.com'],
            ['user3', 'TEST3@EXAMPLE.COM', 'TEST3@example.com'],
            ['user4', 'test4@example.COM', 'test4@example.com']
        ]

        for username, email, expected in sample_data:
            user = get_user_model().objects.create_user(username=username, password='test1234', email=email)

            self.assertEqual(user.email, expected)
