from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role']
        read_only_fields = ['id']


class CreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'role', 'password']

    def validate_role(self, value):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError('Authentication required.')

        if request.user.role == User.ROLE_SUPER_ADMIN:
            allowed_roles = {
                User.ROLE_SUPER_ADMIN,
                User.ROLE_ADMIN,
                User.ROLE_ASSISTANT,
                User.ROLE_STAFF,
            }
        elif request.user.role == User.ROLE_ADMIN:
            allowed_roles = {
                User.ROLE_ASSISTANT,
                User.ROLE_STAFF,
            }
        else:
            allowed_roles = set()

        if value not in allowed_roles:
            raise serializers.ValidationError('You cannot assign that role.')

        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
