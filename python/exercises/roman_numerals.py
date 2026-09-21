VALUES = [
    (1000, "M"), (900, "CM"), (500, "D"), (400, "CD"),
    (100, "C"), (90, "XC"), (50, "L"), (40, "XL"),
    (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I"),
]

SYMBOLS = {symbol: value for value, symbol in VALUES}


def to_roman(number: int) -> str:
    if not 0 < number < 4000:
        raise ValueError("number must be between 1 and 3999")

    result = []
    for value, symbol in VALUES:
        count, number = divmod(number, value)
        result.append(symbol * count)
    return "".join(result)


def from_roman(numeral: str) -> int:
    numeral = numeral.upper()
    total = 0
    prev_value = 0
    for char in reversed(numeral):
        value = SYMBOLS.get(char)
        if value is None:
            raise ValueError(f"invalid roman numeral character: {char}")
        total += value if value >= prev_value else -value
        prev_value = value
    return total


if __name__ == "__main__":
    cases = [1, 4, 9, 14, 40, 90, 444, 1994, 2026, 3999]
    for n in cases:
        roman = to_roman(n)
        assert from_roman(roman) == n, f"round-trip failed for {n}"
        print(f"{n:>5} -> {roman}")
