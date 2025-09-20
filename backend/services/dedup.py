from simhash import Simhash


def simhash64(text: str) -> int:
    return Simhash(text or "").value


def hamming_distance(a: int, b: int) -> int:
    return bin(a ^ b).count("1")


def to_signed_64(val: int) -> int:
    return val - (1 << 64) if val > 0x7FFF_FFFF_FFFF_FFFF else val
