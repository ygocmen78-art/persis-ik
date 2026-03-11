; customInit: installer'ın .onInit fonksiyonu başında çalışır.
!macro customInit
  nsExec::ExecToLog 'taskkill /F /IM "Persis IK.exe" /T'
  nsExec::ExecToLog 'taskkill /F /IM "node.exe" /T'
  Sleep 2500
  nsExec::ExecToLog 'taskkill /F /IM "Persis IK.exe" /T'
  nsExec::ExecToLog 'taskkill /F /IM "node.exe" /T'
  Sleep 500
  Delete "$LOCALAPPDATA\Programs\Persis IK\Uninstall Persis IK.exe"
  Delete "$LOCALAPPDATA\Programs\Persis IK_old\Uninstall Persis IK.exe"
  Delete "$LOCALAPPDATA\Programs\Persis IK Old\Uninstall Persis IK.exe"
  Delete "$LOCALAPPDATA\Programs\Persis IK_old2\Uninstall Persis IK.exe"
  ; perMachine=true ile kurulmus eski surumu de temizle
  Delete "$PROGRAMFILES64\Persis IK\Uninstall Persis IK.exe"
  ; Start Menu klasorunu garantiye al (administrator hesabinda eksik olabilir)
  CreateDirectory "$SMPROGRAMS"
!macroend

; customUnInit: kaldiricinin .onInit fonksiyonu icin
!macro customUnInit
  nsExec::ExecToLog 'taskkill /F /IM "Persis IK.exe" /T'
  nsExec::ExecToLog 'taskkill /F /IM "node.exe" /T'
  Sleep 1500
!macroend

; customCheckAppRunning: dialog yerine sessizce kapat
!macro customCheckAppRunning
  nsExec::ExecToLog 'taskkill /F /IM "Persis IK.exe" /T'
  nsExec::ExecToLog 'taskkill /F /IM "node.exe" /T'
  Sleep 2000
  nsExec::ExecToLog 'taskkill /F /IM "Persis IK.exe" /T'
!macroend
