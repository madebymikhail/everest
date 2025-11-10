import pyautogui
import time
import random
import string
import threading

# --- Global typing control ---
_is_typing = False
_stop_flag = False
_typing_thread = None


def stop_typing():
    """Signal to stop the current typing."""
    global _stop_flag
    _stop_flag = True


def is_typing():
    """Return True if currently typing."""
    return _is_typing


def type_text(text: str, base_delay: float = 0.02):
    """
    Simulates human-like typing with realistic pauses, corrections, and mistypes.
    Can be stopped by calling stop_typing().
    """
    global _is_typing, _stop_flag
    _is_typing = True
    _stop_flag = False

    try:
        time.sleep(random.uniform(0.3, 1.0))  # pre-typing hesitation
        typed_so_far = ""

        for i, char in enumerate(text):
            if _stop_flag:
                print("[typing cancelled]")
                break

            # Occasionally mistype a character
            if random.random() < 0.015 and char.isalpha():
                wrong_char = (
                    random.choice(string.ascii_uppercase.replace(char, ""))
                    if char.isupper()
                    else random.choice(string.ascii_lowercase.replace(char, ""))
                )
                pyautogui.typewrite(wrong_char)
                time.sleep(random.uniform(0.1, 0.3))
                pyautogui.press("backspace")
                time.sleep(random.uniform(0.05, 0.2))
                pyautogui.typewrite(char)
            else:
                pyautogui.typewrite(char)

            delay = random.gauss(base_delay, base_delay / 3)
            delay = max(0.005, delay)
            if char in [".", ",", "!", "?", ";", ":"]:
                delay += random.uniform(6, 12)
            elif char == " ":
                delay += random.uniform(0.05, 0.15)
            time.sleep(delay)

            # Random hesitation
            if random.random() < 0.02 and len(typed_so_far) > 5:
                if _stop_flag:
                    print("[typing cancelled mid-hesitation]")
                    break

                mistake_len = random.randint(1, min(5, len(typed_so_far)))
                for _ in range(mistake_len):
                    pyautogui.press("backspace")
                    time.sleep(random.uniform(0.05, 0.25))
                time.sleep(random.uniform(0.5, 1.5))
                for c in typed_so_far[-mistake_len:]:
                    pyautogui.typewrite(c)
                    time.sleep(random.gauss(base_delay, base_delay / 2))

        print("[typing finished or stopped]")

    finally:
        _is_typing = False
        _stop_flag = False


def start_typing_thread(text: str, base_delay: float = 0.02):
    """Run typing in a background thread."""
    global _typing_thread

    if _is_typing:
        return False  # already typing

    _typing_thread = threading.Thread(target=type_text, args=(text, base_delay))
    _typing_thread.start()
    return True
