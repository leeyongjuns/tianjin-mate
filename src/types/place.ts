export type PlaceCategory =
  | '맛집'
  | '카페'
  | '병원'
  | '마트'
  | '학교'
  | '관광'
  | '교통'
  | '주거'
  | '기타'

export interface Place {
  id: number

  // 장소 이름
  nameKo: string
  nameZh: string

  // 분류
  category: PlaceCategory
  district: string

  // 위치
  addressZh: string
  latitude?: number
  longitude?: number

  // 상세 정보
  description: string
  recommendation?: string
  openingHours?: string
  phone?: string
  imageUrl?: string

  // 정보 관리
  verifiedAt?: string
}