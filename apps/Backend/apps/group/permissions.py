# --- permissions.py ---

from rest_framework import permissions

from django.contrib.auth import get_user_model


User = get_user_model()

class IsSuperDesigner(permissions.BasePermission):
    """
    Custom permission to only allow access to users with specific roles.
    Note: Name is slightly misleading as it includes more than SuperDesigners.
    Consider renaming to something like IsDesignerOrAdminOrPrinter.
    """
    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and hasattr(user, 'role')):
             return False
        allowed_roles = [
            User.Designer,
            user.Reception,
            User.SuperDesigner,
            User.Admin,
            User.Printer,
        ]
        return user.role in allowed_roles

class IsAdminUser(permissions.BasePermission):
     def has_permission(self, request, view):
         return request.user and request.user.is_staff 

class IsOwnerOrAdmin(permissions.BasePermission):
    """ Check if user is owner of the object or an admin """
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser or (hasattr(request.user, 'role') and request.user.role == User.Admin):
            return True
        if hasattr(obj, 'designer'):
            return obj.designer == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False
    
class IsStrictlySuperDesigner(permissions.BasePermission):
    """
    Custom permission to only allow users with the SuperDesigner role (role=3).
    """
    message = "Only SuperDesigners are allowed to perform this action."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and hasattr(request.user, 'role')):
            return False
        
        try:
             super_designer_role = User.SuperDesigner  
        except AttributeError:
             print("Warning: User.SuperDesigner attribute not found on User model. Using literal value 3.")
             super_designer_role = 3

        return request.user.role == super_designer_role
    

class IsSuperDesignerOrReception(permissions.BasePermission):
    """
    Custom permission to allow users with the SuperDesigner (role=3)
    OR Reception (role=2) role.
    """
    message = "Only SuperDesigners or Reception users are allowed to perform this action."
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and hasattr(request.user, 'role')):
            return False
        try:
            super_designer_role = User.SuperDesigner
            reception_role = User.Reception
        except AttributeError:
            print("Warning: User.SuperDesigner or User.Reception attribute not found on User model. Using literal values.")
            super_designer_role = 3
            reception_role = 2

        allowed_roles = [super_designer_role, reception_role]
        return request.user.role in allowed_roles