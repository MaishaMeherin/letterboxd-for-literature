from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg, Count
from .models import Review
from .models import ReviewLike, ReviewComment
from notifications.models import Notification
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

channel_layer = get_channel_layer()

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
    
#post_save fires on both, INSERT/UPDATE. 
#dispatch_uid saves from double signal registration
@receiver(post_save, sender=ReviewLike, dispatch_uid="like_created_notification")
def like_created(sender, instance, created, **kwargs):
    if not created:
        return
    review = instance.review
    
    if instance.user == review.user: #liking own review
        return
    
    Notification.objects.create(
        recipient = review.user,
        sender = instance.user,
        notification_type = 'like',
        review = review,
    )
    
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            f'notifications_{review.user.id}',                        
            {
                'type': 'send_notification',                          
                'data': {
                    'notification_type': 'like',                      
                    'sender_username': instance.user.username,
                    'review_id': str(review.id),                      
                }
            }                                                         
        ) 

@receiver(post_save, sender=ReviewComment, dispatch_uid="comment_created_notification")
def comment_created(sender, instance, created, **kwargs):
    if not created:
        return
    review = instance.review
        
    if instance.user == review.user: #commenting own review
        return
        
    Notification.objects.create(
        recipient = review.user,
        sender = instance.user,
        notification_type = 'comment',
        review = review,
    )
    
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            f'notifications_{review.user.id}',                        
            {
                'type': 'send_notification',                          
                'data': {
                    'notification_type': 'comment',                      
                    'sender_username': instance.user.username,
                    'review_id': str(review.id),                      
                }
            }                                                         
        )