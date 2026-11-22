from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Student


User = get_user_model()


class StudentImportTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='importer',
            email='importer@example.com',
            password='testpass123',
            role='admin',
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_import_students_from_csv(self):
        csv_content = (
            'student_id,first_name,last_name,course,year_level,address,email,phone,status\n'
            'S-001,Ana,Cruz,BSIT,1,Tagaytay City,ana@example.com,09123456789,pending\n'
            'S-002,Mark,Reyes,BSBA,2,Tagaytay City,mark@example.com,,completed\n'
        )
        uploaded_file = SimpleUploadedFile(
            'students.csv',
            csv_content.encode('utf-8'),
            content_type='text/csv',
        )

        response = self.client.post('/api/students/import/', {'file': uploaded_file}, format='multipart')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['created'], 2)
        self.assertEqual(response.data['updated'], 0)
        self.assertFalse(response.data['has_errors'])
        self.assertEqual(Student.objects.count(), 2)
        self.assertTrue(Student.objects.filter(student_id='S-001', first_name='Ana').exists())
        self.assertTrue(Student.objects.filter(student_id='S-002', status=Student.STATUS_COMPLETED).exists())
