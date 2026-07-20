import threading

_thread_locals = threading.local()

def get_current_request():
    """
    Retrieve the current request from thread-local storage.
    """
    return getattr(_thread_locals, 'request', None)

def get_client_ip(request):
    """
    Helper to extract client IP address from request headers.
    """
    if not request:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class AuditLogMiddleware:
    """
    Middleware to store the request object in thread-local storage
    for downstream signals to capture audit trail context.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.request = request
        try:
            response = self.get_response(request)
        finally:
            if hasattr(_thread_locals, 'request'):
                del _thread_locals.request
        return response
