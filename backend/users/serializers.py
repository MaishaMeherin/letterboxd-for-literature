from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

#handles signups
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password']
        
    def create(self, validated_data):
        #create_user() hashes password
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
        )
        
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'display_name', 'bio', 'avatar', 'is_private', 'date_joined']
        read_only_fields = ['id', 'email', 'date_joined']