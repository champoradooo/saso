from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

User = get_user_model()


class AccountRoleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.super_admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin1234',
            role='super_admin',
            first_name='System',
            last_name='Administrator',
        )
        self.admin = User.objects.create_user(
            username='manager',
            email='manager@example.com',
            password='admin1234',
            role='admin',
            first_name='Main',
            last_name='Admin',
        )

    def test_super_admin_can_create_assistant(self):
        self.client.login(username='admin', password='admin1234')

        response = self.client.post('/api/users/', {
            'username': 'assistant1',
            'email': 'assistant1@example.com',
            'first_name': 'Ana',
            'last_name': 'Cruz',
            'role': 'assistant',
            'password': 'secret123',
        }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['role'], 'assistant')
        self.assertTrue(User.objects.filter(username='assistant1', role='assistant').exists())

    def test_admin_cannot_create_super_admin(self):
        self.client.login(username='manager', password='admin1234')

        response = self.client.post('/api/users/', {
            'username': 'boss',
            'email': 'boss@example.com',
            'first_name': 'Big',
            'last_name': 'Boss',
            'role': 'super_admin',
            'password': 'secret123',
        }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('role', response.data)
        self.assertFalse(User.objects.filter(username='boss').exists())
