from django import template

register = template.Library()


@register.filter(name="length_is")
def length_is(value, arg):
    """Compatibility filter removed in Django 5.

    Returns True if len(value) == int(arg), else False.
    """
    try:
        return len(value) == int(arg)
    except Exception:
        return False


