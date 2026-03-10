from math import asin, cos, radians, sin, sqrt


class GeoService:
    @staticmethod
    def distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        earth_radius_m = 6371000
        d_lat = radians(lat2 - lat1)
        d_lon = radians(lon2 - lon1)
        a = (
            sin(d_lat / 2) ** 2
            + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
        )
        return 2 * earth_radius_m * asin(sqrt(a))
