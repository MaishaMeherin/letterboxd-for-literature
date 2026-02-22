from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookViewSet

router = DefaultRouter()
router.register(r'books', BookViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

##DefaultRouter automatically generates standard REST endpoints from a single ViewSet. By registering BookViewSet at 'books', you get these URLs for free:

# Method	URL	Action
# GET	/books/	list all books
# POST	/books/	create a book
# GET	/books/{id}/	retrieve one book
# PUT/PATCH	/books/{id}/	update a book
# DELETE	/books/{id}/	delete a book