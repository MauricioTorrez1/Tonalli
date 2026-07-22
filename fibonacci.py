"""Utilities to generate the Fibonacci sequence."""

from typing import Iterator


def fibonacci(n: int) -> Iterator[int]:
    """Yield the first n numbers of the Fibonacci sequence.

    The sequence starts at 0 and each following number is the sum of the
    two previous ones: 0, 1, 1, 2, 3, 5, 8, ...

    Args:
        n: Amount of numbers to generate. Must be zero or positive.

    Yields:
        The next number in the sequence.

    Raises:
        ValueError: If n is negative.
    """
    if n < 0:
        raise ValueError("n must be zero or a positive integer")

    current, following = 0, 1
    for _ in range(n):
        yield current
        current, following = following, current + following


if __name__ == "__main__":
    print(list(fibonacci(10)))
