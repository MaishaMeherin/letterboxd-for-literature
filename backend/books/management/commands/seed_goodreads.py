import time
from django.core.management.base import BaseCommand
from books.models import Book
from books.tasks import scrape_goodread_books

class Command(BaseCommand):                                                
    help = "Enqueue Celery scraping tasks for all unscraped books with a Goodreads ID"                                                              

    def add_arguments(self, parser):                                       
        parser.add_argument(                                             
            "--limit",
            type=int,
            default=None,
            help="Only enqueue this many books (optional)",                
        )
                                                                            
    def handle(self, *args, **options):                                  
        limit = options["limit"]
                                                                            
        queryset = Book.objects.filter(
            scraped=False,                                                 
            goodreads_id__isnull=False,                                  
        ).exclude(goodreads_id="")
                                                                            
        if limit:
            queryset = queryset[:limit]                                    
                                                                        
        total = queryset.count()
        if total == 0:
            self.stdout.write("No unscraped books with a Goodreads ID found.")                                                                
            return
                                                                            
        self.stdout.write(f"Queuing {total} books...")                     

        for book in queryset:                                              
            scrape_goodread_books.delay(str(book.id))                    
            self.stdout.write(f"  Queued: {book.title} ({book.id})")
            time.sleep(5)                                                  

        self.stdout.write(self.style.SUCCESS(f"Done. {total} tasks          enqueued."))