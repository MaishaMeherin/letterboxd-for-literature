from django.contrib import admin                                                       
from .models import Book, BookShelfTag, CommunitySong                                  


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    search_fields = ("title", "authors", "goodreads_id")
    list_display = ("title", "goodreads_id", "avg_rating", "rating_count")             
                                                                                        
                                                                                        
admin.site.register(BookShelfTag)                                                      
admin.site.register(CommunitySong)