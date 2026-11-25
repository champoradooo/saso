from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

User = get_user_model()


class AccountRoleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin1234',
            role='admin',
            first_name='System',
            last_name='Administrator',
        )
        self.staff = User.objects.create_user(
            username='staff1',
            email='staff1@example.com',
            password='staff1234',
            role='staff',
            first_name='Liza',
            last_name='Cruz',
        )

    def test_admin_can_create_staff(self):
        self.client.login(username='admin', password='admin1234')

        response = self.client.post('/api/users/', {
            'username': 'staff2',
            'email': 'staff2@example.com',
            'first_name': 'Ana',
            'last_name': 'Cruz',
            'role': 'staff',
            'password': 'secret123',
        }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['role'], 'staff')
        self.assertTrue(User.objects.filter(username='staff2', role='staff').exists())

    def test_admin_can_create_admin(self):
        self.client.login(username='admin', password='admin1234')

        response = self.client.post('/api/users/', {
            'username': 'admin2',
            'email': 'admin2@example.com',
            'first_name': 'Main',
            'last_name': 'Admin',
            'role': 'admin',
            'password': 'secret123',
        }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['role'], 'admin')

    def test_staff_cannot_create_users(self):
        self.client.login(username='staff1', password='staff1234')

        response = self.client.post('/api/users/', {
            'username': 'boss',
            'email': 'boss@example.com',
            'first_name': 'Big',
            'last_name': 'Boss',
            'role': 'admin',
            'password': 'secret123',
        }, format='json')

        self.assertEqual(response.status_code, 403)
        self.assertFalse(User.objects.filter(username='boss').exists())

    def test_invalid_role_rejected(self):
        self.client.login(username='admin', password='admin1234')

        response = self.client.post('/api/users/', {
            'username': 'legacy',
            'email': 'legacy@example.com',
            'first_name': 'Old',
            'last_name': 'Role',
            'role': 'super_admin',
            'password': 'secret123',
        }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('role', response.data)
        self.assertFalse(User.objects.filter(username='legacy').exists())
