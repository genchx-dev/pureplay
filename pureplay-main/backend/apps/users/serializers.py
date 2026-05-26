from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    phone = serializers.CharField(source='phone_number', required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'phone', 'tier', 'rank')
        read_only_fields = ('tier', 'rank')
        extra_kwargs = {'email': {'required': False, 'allow_blank': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            phone_number=validated_data.get('phone', ''),   # ✅ fixed
        )
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()