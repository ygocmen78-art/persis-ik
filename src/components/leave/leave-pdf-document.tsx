"use client"

import React from 'react'
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { getLeaveLabel } from "@/lib/leave-types"

// Turkish Character Support Font
Font.register({
    family: 'Roboto',
    fonts: [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 }
    ]
})

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Roboto', fontSize: 10, color: '#000' },
    header: { textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 20 },
    dateRight: { textAlign: 'right', marginBottom: 15 },
    table: { width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#000', marginBottom: 20 },
    row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
    lastRow: { flexDirection: 'row' },
    colLabel: { width: '35%', padding: 5, borderRightWidth: 1, borderRightColor: '#000', fontWeight: 'bold' },
    colValue: { width: '65%', padding: 5 },
    checkboxes: { flexDirection: 'row', gap: 10 },
    checkboxItem: { flexDirection: 'row', alignItems: 'center' },
    checkboxBox: { width: 10, height: 10, borderWidth: 1, borderColor: '#000', marginRight: 4, justifyContent: 'center', alignItems: 'center' },
    checkmark: { fontSize: 8, marginTop: -2 },
    signaturesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
    signatureBlock: { width: '30%', textAlign: 'center' },
    signatureTitle: { fontWeight: 'bold', marginBottom: 5 },
    signatureName: { marginBottom: 30, fontSize: 9 },
    signatureLabel: { fontSize: 9 },
    footerNote: { marginTop: 40, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 5 }
})

export const LeavePdfDocument = ({ data }: { data: any }) => {
    const { leave, employee } = data

    const getCheckbox = (type: string, targetType: string, label: string) => {
        let checked = false
        if (targetType === 'unpaid' && type === 'unpaid') checked = true
        if (targetType === 'annual' && type === 'annual') checked = true
        if (targetType === 'other' && !['unpaid', 'annual'].includes(type)) checked = true

        return (
            <View style={styles.checkboxItem}>
                <View style={styles.checkboxBox}>
                    {checked && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text>{label}</Text>
            </View>
        )
    }

    const startDateFmt = leave?.startDate ? format(new Date(leave.startDate), 'dd.MM.yyyy') : ''
    const endDateFmt = leave?.endDate ? format(new Date(leave.endDate), 'dd.MM.yyyy') : ''
    const returnDateFmt = leave?.returnDate ? format(new Date(leave.returnDate), 'dd.MM.yyyy') : ''

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.header}>İZİN KULLANIM TALEP FORMU</Text>
                <Text style={styles.dateRight}>{format(new Date(), 'dd.MM.yyyy')}</Text>

                <View style={styles.table}>
                    <View style={styles.row}>
                        <View style={styles.colLabel}><Text>Personel Kodu</Text></View>
                        <View style={styles.colValue}><Text>{employee?.id?.toString().padStart(3, '0')}</Text></View>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.colLabel}><Text>Adı ve Soyadı</Text></View>
                        <View style={styles.colValue}><Text>{employee?.firstName} {employee?.lastName}</Text></View>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.colLabel}><Text>T.C. Kimlik No - SGK Sicil No</Text></View>
                        <View style={styles.colValue}><Text>{employee?.tcNumber || ''} - {employee?.sgkExitCode || ''}</Text></View>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.colLabel}><Text>İşe Giriş Tarihi</Text></View>
                        <View style={styles.colValue}><Text>{employee?.startDate ? format(new Date(employee.startDate), 'dd.MM.yyyy') : ''}</Text></View>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.colLabel}><Text>Görevi</Text></View>
                        <View style={styles.colValue}><Text>{employee?.position || ''}</Text></View>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.colLabel}><Text>Departmanı</Text></View>
                        <View style={styles.colValue}><Text>{employee?.department || ''}</Text></View>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.colLabel}><Text>İzin Türü</Text></View>
                        <View style={styles.colValue}>
                            <Text>{getLeaveLabel(leave?.type)}</Text>
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.colLabel}><Text>İzin Süresi (Gün)</Text></View>
                        <View style={styles.colValue}><Text>{leave?.daysCount} GÜN</Text></View>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.colLabel}><Text>İzin Başlangıç Tarihi</Text></View>
                        <View style={styles.colValue}><Text>{startDateFmt}</Text></View>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.colLabel}><Text>İzin Bitiş Tarihi</Text></View>
                        <View style={styles.colValue}><Text>{endDateFmt}</Text></View>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.colLabel}><Text>İşe Başlama Tarihi</Text></View>
                        <View style={styles.colValue}><Text>{returnDateFmt}</Text></View>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.colLabel}><Text>İzindeki Adresi / Detay</Text></View>
                        <View style={styles.colValue}><Text>{leave?.description || ''}</Text></View>
                    </View>
                    <View style={styles.lastRow}>
                        <View style={styles.colLabel}><Text>İletişim Telefonu</Text></View>
                        <View style={styles.colValue}><Text>{employee?.phone || ''}</Text></View>
                    </View>
                </View>

                <View style={styles.signaturesRow}>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureTitle}>PERSONEL</Text>
                        <Text style={styles.signatureName}>{employee?.firstName} {employee?.lastName}</Text>
                        <Text style={styles.signatureLabel}>İmza</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureTitle}>BİRİM AMİRİ</Text>
                        <Text style={styles.signatureName}>........................</Text>
                        <Text style={styles.signatureLabel}>Ad Soyad/İmza</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureTitle}>ONAY (İnsan Kaynakları)</Text>
                        <Text style={styles.signatureName}>ZOFUNLAR HAZIR BETON{'\n'}MAD.İNŞ.MALZ.SAN.VE{'\n'}TİC.LTD.ŞTİ.</Text>
                        <Text style={styles.signatureLabel}>Kaşe/İmza</Text>
                    </View>
                </View>

                <View style={styles.footerNote}>
                    <Text>{startDateFmt} - {endDateFmt} Tarihleri arasında {getLeaveLabel(leave?.type)} kullandım. Bilgilerinize arz ederim.</Text>
                </View>
            </Page>
        </Document>
    )
}
