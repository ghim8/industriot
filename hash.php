<?php
if (isset($_GET['mdp'])) {
    $mdp = $_GET['mdp'];
    $hash = password_hash($mdp, PASSWORD_DEFAULT);

    echo "<h3>Mot de passe :</h3> " . htmlspecialchars($mdp);
    echo "<h3>Hash :</h3> " . $hash;
} else {
    echo "Ajoute ?mdp=tonmotdepasse dans l'URL";
}
?>