; customInit: installer'ın .onInit fonksiyonu başında, herhangi bir kontrol yapılmadan ÖNCE çalışır.
; Bu, customCheckAppRunning'in derleme sırası sorununu bypass eder.
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
!macroend

; customUnInit: kaldırıcı (.onInit) için aynı işlemi yapar.
!macro customUnInit
  nsExec::ExecToLog 'taskkill /F /IM "Persis IK.exe" /T'
  nsExec::ExecToLog 'taskkill /F /IM "node.exe" /T'
  Sleep 1500
!macroend

; customCheckAppRunning: yine de tanımlı kalsın — eğer electron-builder versiyonu
; bu makroyu derleme sırasından bağımsız olarak destekliyorsa devreye girer.
!macro customCheckAppRunning
  nsExec::ExecToLog 'taskkill /F /IM "Persis IK.exe" /T'
  nsExec::ExecToLog 'taskkill /F /IM "node.exe" /T'
  Sleep 2000
  nsExec::ExecToLog 'taskkill /F /IM "Persis IK.exe" /T'
!macroend
