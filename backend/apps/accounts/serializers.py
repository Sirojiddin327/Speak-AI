"""Serializers for accounts app."""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    """Serializer for user registration."""
    username = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(max_length=254, required=True)
    password = serializers.CharField(max_length=128, write_only=True, required=True)
    cefr_level = serializers.ChoiceField(
        choices=[('A1', 'A1'), ('A2', 'A2'), ('B1', 'B1'), ('B2', 'B2'), ('C1', 'C1'), ('C2', 'C2')],
        default='A1'
    )
    
    def validate(self, data):
        # Check if username already exists
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({'username': 'A user with that username already exists.'})
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({'email': 'A user with that email already exists.'})
        return data
    
    def save(self):
        """Create a new user."""
        user = User.objects.create_user(
            username=self.validated_data['username'],
            email=self.validated_data['email'],
            password=self.validated_data['password'],
            cefr_level=self.validated_data.get('cefr_level', 'A1'),
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user details."""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'cefr_level', 'daily_goal_minutes', 'date_joined', 'last_login']
        read_only_fields = ['id', 'date_joined', 'last_login']