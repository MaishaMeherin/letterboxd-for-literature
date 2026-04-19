from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg, Count
from .models import Review

#avg_rating and rating count will be changed, everytime a review is edited or deleted with signals (a function that fires automatically whenever any Review is saved or deleted from anywhere in the codebase)
def _recalculate_book_stats(book):
    stats = Review.objects.filter(book=book).aggregate(
        avg=Avg('rating'), count=Count('id')
    )
    
    #.update() is atomic, avoids triggering other signals
    from books.models import Book
    Book.objects.filter(pk=book.pk).update(
        avg_rating=stats['avg'] or 0,
        rating_count=stats['count'] or 0,
    )
    
@receiver(post_save, sender=Review)
def review_saved(sender, instance, **kwargs):
    _recalculate_book_stats(instance.book)
    
@receiver(post_delete, sender=Review)
def review_deleted(sender, instance, **kwargs):
    _recalculate_book_stats(instance.book)